pub mod error;
pub mod listing;
pub mod package;
pub mod s3;

pub use error::ArtifactUpdateError;
use tokio::sync::RwLock;

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use std::time::Instant;

use reqwest::StatusCode;
use time::format_description::well_known::Rfc2822;
use url::Url;

use tracing::*;

use crate::updater::artifacts::s3::S3BaseUrl;
use crate::updater::artifacts::s3::S3Channel;
use crate::updater::package::PlatformPackage;
use crate::updater::Channel;

pub trait ResponseExt {
	fn parse_etag_and_pub_date(&self) -> Result<(String, time::OffsetDateTime), ArtifactUpdateError>;
}

impl ResponseExt for reqwest::Response {
	fn parse_etag_and_pub_date(&self) -> Result<(String, time::OffsetDateTime), ArtifactUpdateError> {
		let etag = self
			.headers()
			.get("etag")
			.and_then(|e| e.to_str().ok())
			.ok_or(ArtifactUpdateError::InvalidOrMissingHeader("etag"))?
			.to_string();

		let pub_date = self
			.headers()
			.get("last-modified")
			.and_then(|e| e.to_str().ok())
			.and_then(|v| time::OffsetDateTime::parse(v, &Rfc2822).ok())
			.ok_or(ArtifactUpdateError::InvalidOrMissingHeader("last-modified"))?;

		Ok((etag, pub_date))
	}
}

#[derive(Clone)]
pub struct ArtifactStore {
	channels: Arc<HashMap<Channel, ArtifactsByChannel>>,
}

pub struct ArtifactsByChannel {
	upstream_s3: Arc<S3Channel>,
	http: Arc<reqwest::Client>,

	latest: Arc<RwLock<HashMap<PlatformPackage, LatestVersionArtifacts>>>,
	versions: RwLock<Option<CachedVersions>>,
}

const VERSIONS_CACHE_TTL: Duration = Duration::from_secs(6 * 60 * 60);

struct CachedVersions {
	fetched_at: Instant,
	versions: Arc<Vec<ChannelVersion>>,
}

#[derive(Clone, Debug)]
pub struct ChannelVersion {
	pub version: semver::Version,
	pub packages: Vec<PlatformPackage>,
}

pub struct LatestVersionArtifacts {
	pub installer: ArtifactMetadata,
	pub update: ArtifactMetadata,

	pub exact_version_etag: ExactVersionEtag,
	pub signature: String,
}

pub struct ExactVersionEtag {
	pub exact_version: semver::Version,
	pub etag: String,
	pub pub_date: time::OffsetDateTime,
}

#[derive(Clone, Debug)]
pub struct ArtifactMetadata {
	pub url: Url,
	pub etag: String,
	pub pub_date: time::OffsetDateTime,
}

#[derive(Clone, Debug)]
pub struct ArtifactUpdate {
	pub version: semver::Version,
	pub pub_date: time::OffsetDateTime,
	pub s3_url: Url,
	pub signature: String,
}

impl From<&LatestVersionArtifacts> for ArtifactUpdate {
	fn from(latest: &LatestVersionArtifacts) -> Self {
		Self {
			version: latest.exact_version_etag.exact_version.clone(),
			pub_date: latest.exact_version_etag.pub_date,
			signature: latest.signature.clone(),
			s3_url: latest.update.url.clone(),
		}
	}
}

impl ArtifactStore {
	pub fn new(upstream_s3_base_url: S3BaseUrl) -> Self {
		let http = Arc::new(reqwest::Client::new());

		let channels = Channel::all().map(|channel| {
			(
				channel,
				ArtifactsByChannel {
					latest: Arc::new(RwLock::new(HashMap::new())),
					versions: RwLock::new(None),
					upstream_s3: Arc::new(upstream_s3_base_url.channel(channel)),
					http: http.clone(),
				},
			)
		});

		Self {
			channels: Arc::new(HashMap::from_iter(channels)),
		}
	}

	pub fn channel(&self, channel: Channel) -> &ArtifactsByChannel {
		self
			.channels
			.get(&channel)
			.expect("channel not found; you probably forgot to call `Channel::all()` at init")
	}
}

impl ArtifactsByChannel {
	pub async fn get_latest_update_by_version(
		&self,
		version: semver::Version,
		platform_package: PlatformPackage,
	) -> Result<ArtifactUpdate, ArtifactUpdateError> {
		let s3_url = self.upstream_s3.version(version).latest_version_pointer(platform_package);
		let latest = self.fetch_latest_version(s3_url, platform_package).await?;
		let latest = latest.ok_or(ArtifactUpdateError::NotFound)?;

		Ok(ArtifactUpdate::from(&latest))
	}

	pub async fn get_latest_update(&self, platform_package: PlatformPackage) -> Result<ArtifactUpdate, ArtifactUpdateError> {
		let latest = self.latest.read().await;
		let latest = latest.get(&platform_package).ok_or(ArtifactUpdateError::NotFound)?;

		Ok(ArtifactUpdate::from(latest))
	}

	pub async fn latest_installer_download_url(&self, platform_package: PlatformPackage) -> Result<(Url, semver::Version), ArtifactUpdateError> {
		let latest = self.latest.read().await;
		let v = latest.get(&platform_package).ok_or(ArtifactUpdateError::NotFound)?;
		Ok((v.installer.url.clone(), v.exact_version_etag.exact_version.clone()))
	}

	pub fn installer_url(&self, version: semver::Version, platform_package: PlatformPackage) -> Url {
		self.upstream_s3.version(version).installer(platform_package)
	}

	pub async fn list_versions(&self) -> Result<Arc<Vec<ChannelVersion>>, ArtifactUpdateError> {
		let fresh = |cached: &Option<CachedVersions>| {
			cached
				.as_ref()
				.filter(|c| c.fetched_at.elapsed() < VERSIONS_CACHE_TTL)
				.map(|c| c.versions.clone())
		};

		if let Some(versions) = fresh(&*self.versions.read().await) {
			return Ok(versions);
		}

		// Hold the write lock across the fetch so concurrent misses don't each walk s3.
		let mut cached = self.versions.write().await;
		if let Some(versions) = fresh(&cached) {
			return Ok(versions);
		}

		let versions = Arc::new(self.fetch_all_versions().await?);

		*cached = Some(CachedVersions {
			fetched_at: Instant::now(),
			versions: versions.clone(),
		});

		Ok(versions)
	}

	// A flat listing of the whole channel walks every object and is an order of magnitude
	// slower than listing the release lines concurrently.
	async fn fetch_all_versions(&self) -> Result<Vec<ChannelVersion>, ArtifactUpdateError> {
		let key_prefix = self.upstream_s3.list_key_prefix();

		let mut tasks = tokio::task::JoinSet::new();
		for prefix in self.list_release_lines().await? {
			let Some(line) = prefix.strip_prefix(&key_prefix) else { continue };
			if !listing::is_release_line(line) {
				continue;
			}
			tasks.spawn(list_line_objects(self.http.clone(), self.upstream_s3.clone(), line.to_string()));
		}

		let mut by_version: HashMap<semver::Version, Vec<PlatformPackage>> = HashMap::new();

		while let Some(joined) = tasks.join_next().await {
			for key in joined.expect("list task panicked")? {
				let Some(relative_key) = key.strip_prefix(&key_prefix) else { continue };
				let Some((version, platform_package)) = listing::parse_installer_key(relative_key) else {
					continue;
				};

				by_version.entry(version).or_default().push(platform_package);
			}
		}

		let mut versions: Vec<ChannelVersion> = by_version
			.into_iter()
			.map(|(version, packages)| ChannelVersion { version, packages })
			.collect();

		versions.sort_by(|a, b| b.version.cmp(&a.version));

		for version in &mut versions {
			version.packages.sort();
		}

		Ok(versions)
	}

	async fn list_release_lines(&self) -> Result<Vec<String>, ArtifactUpdateError> {
		let listed = list_pages(&self.http, &self.upstream_s3, None, true).await?;
		Ok(listed.common_prefixes)
	}

	pub async fn update_latest_if_needed(&self, platform_package: Option<PlatformPackage>) -> Result<(), ArtifactUpdateError> {
		let to_check = match platform_package {
			Some(platform_package) => vec![platform_package],
			None => PlatformPackage::all().to_vec(),
		};

		for platform_package in to_check {
			if self.needs_update(platform_package).await? {
				self.update_latest_versions().await?;
				break;
			}
		}

		Ok(())
	}

	pub async fn needs_update(&self, platform_package: PlatformPackage) -> Result<bool, ArtifactUpdateError> {
		let latest = self.latest.read().await;
		let Some(v) = latest.get(&platform_package) else {
			return Ok(true);
		};

		let s3_url = self.upstream_s3.latest_version_pointer(platform_package);
		let outdated = self.is_etag_outdated(platform_package, &v.exact_version_etag.etag, s3_url).await?;

		Ok(outdated)
	}

	async fn is_etag_outdated(&self, platform_package: PlatformPackage, etag: &str, s3_url: Url) -> Result<bool, ArtifactUpdateError> {
		let res = self
			.http
			.head(s3_url.clone())
			.send()
			.await
			.and_then(|r| r.error_for_status())
			.map_err(ArtifactUpdateError::CheckEtag)?;

		let s3_etag = res
			.headers()
			.get("etag")
			.and_then(|e| e.to_str().ok())
			.ok_or(ArtifactUpdateError::InvalidOrMissingHeader("etag"))?;

		let needs_update = !s3_etag.eq(etag);

		if needs_update {
			info!("exact version etag differs for {} and needs update", platform_package);
		} else {
			debug!("exact version etag for {} is up to date", platform_package);
		}

		Ok(needs_update)
	}

	// Runs when a new release is discovered (etag mismatch), so the cached version
	// listing is stale too — drop it instead of waiting out the TTL.
	pub async fn update_latest_versions(&self) -> Result<(), ArtifactUpdateError> {
		info!("updating latest versions");

		*self.versions.write().await = None;

		for platform_package in PlatformPackage::all() {
			let s3_url = self.upstream_s3.latest_version_pointer(platform_package);

			let Some(latest) = self.fetch_latest_version(s3_url, platform_package).await? else {
				continue;
			};

			self.latest.write().await.insert(platform_package, latest);
		}

		Ok(())
	}

	async fn fetch_latest_version(
		&self,
		s3_url: Url,
		platform_package: PlatformPackage,
	) -> Result<Option<LatestVersionArtifacts>, ArtifactUpdateError> {
		let res = self.http.get(s3_url).send().await.map_err(ArtifactUpdateError::LatestFetchFailed)?;

		if res.status() == StatusCode::NOT_FOUND {
			warn!(
				"version file not found for {} at {}",
				platform_package,
				self.upstream_s3.latest_version_pointer(platform_package)
			);
			return Ok(None);
		}

		let res = res.error_for_status().map_err(ArtifactUpdateError::LatestFetchFailed)?;

		let (etag, pub_date) = res.parse_etag_and_pub_date()?;
		let exact_version = res
			.text()
			.await
			.map(|v| semver::Version::parse(&v))
			.map_err(ArtifactUpdateError::LatestFetchFailed)?
			.map_err(ArtifactUpdateError::InvalidVersion)?;

		let s3 = self.upstream_s3.version(exact_version.clone());

		let (installer, update, signature) = tokio::try_join!(
			self.artifact_metadata(s3.installer(platform_package)),
			self.artifact_metadata(s3.update(platform_package)),
			self.fetch_signature(s3.signature(platform_package)),
		)?;

		let prev_version = self
			.latest
			.read()
			.await
			.get(&platform_package)
			.map(|v| v.exact_version_etag.exact_version.to_string())
			.unwrap_or_else(|| "<none>".to_string());

		info!("fetched latest version for {}: {} -> {}", platform_package, prev_version, exact_version);

		let artifacts = LatestVersionArtifacts {
			installer,
			update,
			signature,
			exact_version_etag: ExactVersionEtag {
				exact_version,
				etag,
				pub_date,
			},
		};

		Ok(Some(artifacts))
	}

	async fn artifact_metadata(&self, url: Url) -> Result<ArtifactMetadata, ArtifactUpdateError> {
		let (etag, pub_date) = self
			.http
			.head(url.clone())
			.send()
			.await
			.and_then(|r| r.error_for_status())
			.map_err(ArtifactUpdateError::LatestFetchFailed)?
			.parse_etag_and_pub_date()?;

		Ok(ArtifactMetadata { url, etag, pub_date })
	}

	async fn fetch_signature(&self, url: Url) -> Result<String, ArtifactUpdateError> {
		self
			.http
			.get(url)
			.send()
			.await
			.and_then(|r| r.error_for_status())
			.map_err(ArtifactUpdateError::LatestFetchFailed)?
			.text()
			.await
			.map_err(ArtifactUpdateError::LatestFetchFailed)
	}
}

struct ListedObjects {
	keys: Vec<String>,
	common_prefixes: Vec<String>,
}

async fn list_line_objects(http: Arc<reqwest::Client>, s3: Arc<S3Channel>, line: String) -> Result<Vec<String>, ArtifactUpdateError> {
	let listed = list_pages(&http, &s3, Some(&line), false).await?;
	Ok(listed.keys)
}

async fn list_pages(http: &reqwest::Client, s3: &S3Channel, sub_prefix: Option<&str>, delimiter: bool) -> Result<ListedObjects, ArtifactUpdateError> {
	let mut listed = ListedObjects {
		keys: Vec::new(),
		common_prefixes: Vec::new(),
	};
	let mut continuation_token: Option<String> = None;

	loop {
		let url = s3.list_objects_url(sub_prefix, delimiter, continuation_token.as_deref());
		let res = http.get(url).send().await.map_err(ArtifactUpdateError::ListFailed)?;

		if res.status() == StatusCode::FORBIDDEN {
			return Err(ArtifactUpdateError::ListForbidden);
		}

		let res = res.error_for_status().map_err(ArtifactUpdateError::ListFailed)?;
		let xml = res.text().await.map_err(ArtifactUpdateError::ListFailed)?;
		let page = listing::parse_list_objects_page(&xml).map_err(ArtifactUpdateError::ListParseFailed)?;

		listed.keys.extend(page.keys);
		listed.common_prefixes.extend(page.common_prefixes);

		match page.next_continuation_token {
			Some(token) => continuation_token = Some(token),
			None => break,
		}
	}

	Ok(listed)
}
