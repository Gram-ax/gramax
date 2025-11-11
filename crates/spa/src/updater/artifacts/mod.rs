pub mod error;
pub mod package;
pub mod s3;

pub use error::ArtifactUpdateError;
use tokio::sync::RwLock;

use std::collections::HashMap;
use std::sync::Arc;

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

impl ArtifactStore {
  pub fn new(upstream_s3_base_url: S3BaseUrl) -> Self {
    let http = Arc::new(reqwest::Client::new());

    let channels = Channel::all().map(|channel| {
      (
        channel,
        ArtifactsByChannel {
          latest: Arc::new(RwLock::new(HashMap::new())),
          upstream_s3: Arc::new(upstream_s3_base_url.channel(channel)),
          http: http.clone(),
        },
      )
    });

    Self { channels: Arc::new(HashMap::from_iter(channels)) }
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
    let s3_version_url = self.upstream_s3.version(version.clone());
    let s3_url = s3_version_url.latest_version_pointer(platform_package);

    let latest = self.fetch_latest_version(s3_url, platform_package).await?;

    let Some(latest) = latest else {
      return Err(ArtifactUpdateError::NotFound);
    };

    let update = ArtifactUpdate {
      version: latest.exact_version_etag.exact_version.clone(),
      pub_date: latest.exact_version_etag.pub_date,
      signature: latest.signature.clone(),
      s3_url: latest.update.url.clone(),
    };

    Ok(update)
  }

  pub async fn get_latest_update(
    &self,
    platform_package: PlatformPackage,
  ) -> Result<ArtifactUpdate, ArtifactUpdateError> {
    let latest = self.latest.read().await;
    let v = latest.get(&platform_package).ok_or(ArtifactUpdateError::NotFound)?;

    let update = ArtifactUpdate {
      version: v.exact_version_etag.exact_version.clone(),
      pub_date: v.exact_version_etag.pub_date,
      signature: v.signature.clone(),
      s3_url: v.update.url.clone(),
    };

    Ok(update)
  }

  pub async fn latest_installer_download_url(
    &self,
    platform_package: PlatformPackage,
  ) -> Result<(Url, semver::Version), ArtifactUpdateError> {
    let latest = self.latest.read().await;
    let v = latest.get(&platform_package).ok_or(ArtifactUpdateError::NotFound)?;
    Ok((v.installer.url.clone(), v.exact_version_etag.exact_version.clone()))
  }

  pub async fn update_latest_if_needed(
    &self,
    platform_package: Option<PlatformPackage>,
  ) -> Result<(), ArtifactUpdateError> {
    match platform_package {
      Some(platform_package) if self.needs_update(platform_package).await? => {
        self.update_latest_versions().await?;
      }
      None => {
        for platform_package in PlatformPackage::all() {
          if self.needs_update(platform_package).await? {
            self.update_latest_versions().await?;
            break;
          }
        }
      }

      _ => {}
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

  async fn is_etag_outdated(
    &self,
    platform_package: PlatformPackage,
    etag: &str,
    s3_url: Url,
  ) -> Result<bool, ArtifactUpdateError> {
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

  pub async fn update_latest_versions(&self) -> Result<(), ArtifactUpdateError> {
    info!("updating latest versions");

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

    let (installer_etag, installer_pub_date) = self
      .http
      .head(s3.installer(platform_package))
      .send()
      .await
      .and_then(|r| r.error_for_status())
      .map_err(ArtifactUpdateError::LatestFetchFailed)?
      .parse_etag_and_pub_date()?;

    let (update_etag, update_pub_date) = self
      .http
      .head(s3.update(platform_package))
      .send()
      .await
      .and_then(|r| r.error_for_status())
      .map_err(ArtifactUpdateError::LatestFetchFailed)?
      .parse_etag_and_pub_date()?;

    let signature = self
      .http
      .get(s3.signature(platform_package))
      .send()
      .await
      .and_then(|r| r.error_for_status())
      .map_err(ArtifactUpdateError::LatestFetchFailed)?
      .text()
      .await
      .map_err(ArtifactUpdateError::LatestFetchFailed)?;

    let prev_version = self
      .latest
      .read()
      .await
      .get(&platform_package)
      .map(|v| v.exact_version_etag.exact_version.to_string())
      .unwrap_or_else(|| "<none>".to_string());

    info!("fetched latest version for {}: {} -> {}", platform_package, prev_version, exact_version);

    let artifacts = LatestVersionArtifacts {
      installer: ArtifactMetadata {
        url: s3.installer(platform_package),
        etag: installer_etag,
        pub_date: installer_pub_date,
      },
      update: ArtifactMetadata {
        url: s3.update(platform_package),
        etag: update_etag,
        pub_date: update_pub_date,
      },
      signature,
      exact_version_etag: ExactVersionEtag { exact_version, etag, pub_date },
    };

    Ok(Some(artifacts))
  }
}
