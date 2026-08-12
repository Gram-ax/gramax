use std::ops::Deref;

use url::Url;

use crate::updater::package::PlatformPackage;
use crate::updater::Channel;
use crate::updater::Version;

#[derive(Clone, Debug)]
pub struct S3BaseUrl(pub Url);

impl S3BaseUrl {
	pub fn new(url: Url) -> Self {
		Self(url)
	}

	pub fn channel(&self, channel: Channel) -> S3Channel {
		S3Channel(self.clone(), channel)
	}

	pub fn with_path<I>(&self, parts: I) -> Url
	where
		I: IntoIterator,
		I::Item: AsRef<str>,
	{
		let mut url = self.0.clone();
		url.path_segments_mut().unwrap().extend(parts);
		url
	}
}

impl Deref for S3BaseUrl {
	type Target = Url;

	fn deref(&self) -> &Self::Target {
		&self.0
	}
}

pub struct S3Channel(S3BaseUrl, Channel);

impl S3Channel {
	pub fn base_url(&self) -> &S3BaseUrl {
		&self.0
	}

	pub fn latest_version_pointer(&self, platform_package: PlatformPackage) -> Url {
		self.base_url().with_path([
			self.1.as_ref(),
			&Version::Latest.to_string(),
			&format!(
				"gramax.{}.{}.version",
				platform_package.platform().as_ref(),
				platform_package.package().as_ref()
			),
		])
	}

	pub fn version(&self, version: semver::Version) -> S3ExactVersion<'_> {
		S3ExactVersion(self, version)
	}

	// Path-style url: the first path segment of the base url is the bucket, deeper
	// segments are a key prefix inside it and must go into the `prefix` query parameter.
	pub fn list_objects_url(&self, sub_prefix: Option<&str>, delimiter: bool, continuation_token: Option<&str>) -> Url {
		let mut url = self.base_url().0.clone();
		let bucket = url.path_segments().into_iter().flatten().next().unwrap_or_default().to_string();
		url.set_path(&bucket);

		let mut prefix = self.list_key_prefix();
		if let Some(sub_prefix) = sub_prefix {
			prefix.push_str(sub_prefix);
		}

		{
			let mut query = url.query_pairs_mut();
			query.append_pair("list-type", "2").append_pair("prefix", &prefix);
			if delimiter {
				query.append_pair("delimiter", "/");
			}
			if let Some(token) = continuation_token {
				query.append_pair("continuation-token", token);
			}
		}

		url
	}

	pub fn list_key_prefix(&self) -> String {
		let mut prefix = String::new();

		if let Some(segments) = self.base_url().path_segments() {
			for segment in segments.skip(1).filter(|s| !s.is_empty()) {
				prefix.push_str(segment);
				prefix.push('/');
			}
		}

		prefix.push_str(self.1.as_ref());
		prefix.push('/');
		prefix
	}
}

pub struct S3ExactVersion<'s>(&'s S3Channel, semver::Version);

impl<'s> S3ExactVersion<'s> {
	pub fn base_url(&self) -> &S3BaseUrl {
		self.0.base_url()
	}

	pub fn latest_version_pointer(&self, platform_package: PlatformPackage) -> Url {
		let (part1, _) = self.1.split();

		self.base_url().with_path([
			self.0 .1.as_ref(),
			part1.as_ref(),
			&Version::Latest.to_string(),
			&format!(
				"gramax.{}.{}.version",
				platform_package.platform().as_ref(),
				platform_package.package().as_ref()
			),
		])
	}

	pub fn signature(&self, platform_package: PlatformPackage) -> Url {
		let (part1, part2) = self.1.split();

		self.base_url().with_path([
			self.0 .1.as_ref(),
			part1.as_ref(),
			part2.as_ref(),
			platform_package.platform().as_ref(),
			platform_package.signature_artifact_name(),
		])
	}

	pub fn update(&self, platform_package: PlatformPackage) -> Url {
		let (part1, part2) = self.1.split();

		self.base_url().with_path([
			self.0 .1.as_ref(),
			part1.as_ref(),
			part2.as_ref(),
			platform_package.platform().as_ref(),
			platform_package.update_artifact_name(),
		])
	}

	pub fn installer(&self, platform_package: PlatformPackage) -> Url {
		let (part1, part2) = self.1.split();

		self.base_url().with_path([
			self.0 .1.as_ref(),
			part1.as_ref(),
			part2.as_ref(),
			platform_package.platform().as_ref(),
			platform_package.installer_artifact_name(),
		])
	}
}

pub trait SplitVersion {
	fn split(&self) -> (String, String);
}

impl SplitVersion for semver::Version {
	fn split(&self) -> (String, String) {
		let part2 = if self.pre.is_empty() {
			format!("{}", self.patch)
		} else {
			format!("{}-{}", self.patch, self.pre)
		};

		(format!("{}.{}", self.major, self.minor), part2)
	}
}
