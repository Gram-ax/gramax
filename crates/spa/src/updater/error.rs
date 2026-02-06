use axum::response::IntoResponse;
use axum::response::Response;

use crate::updater::artifacts::error::PackageError;
use crate::updater::ArtifactUpdateError;
use crate::updater::Channel;
use crate::updater::PlatformPackage;
use crate::updater::Version;

#[derive(thiserror::Error, Debug)]
pub enum UpdaterError {
	#[error("no release found on server ({}, {}, v{})", .channel, .platform.map(|p| p.as_pair()).map(|(p, v)| format!("{}-{}", p, v)).unwrap_or("<unknown>".to_string()), .version)]
	UpdateNotFound {
		channel: Channel,
		platform: Option<PlatformPackage>,
		version: Version,
	},

	#[error("no update required")]
	NoUpdateRequired,

	#[error("installer not found for {0}")]
	InstallerNotFound(PlatformPackage),

	#[error("failed to fetch update: {}", report(&.0))]
	FailedToFetchUpdate(#[from] ArtifactUpdateError),

	#[error("file not found at upstream s3 server: {0}")]
	S3NotFound(String),

	#[error(transparent)]
	InvalidPlatformPackagePair(#[from] PackageError),

	#[error("failed to parse url: {}", report(&.0))]
	Parse(url::ParseError),

	#[error("failed to build response: {}", report(&.0))]
	FailedToBuildResponse(axum::http::Error),

	#[error("failed to fetch from upstream s3 server: {}", report(&.0))]
	S3FailedToFetch(reqwest::Error),
}

#[derive(thiserror::Error, Debug)]
pub enum ArtifactError {
	#[error("failed to send a request to an upstream s3 server: {}", report(&.0))]
	S3HeadRequest(reqwest::Error),
	#[error("upstream s3 server missing or sent an invalid {0} header")]
	InvalidOrMissingHeader(&'static str),

	#[error("latest version not found")]
	LatestVersionNotFound,
}

impl From<reqwest::Error> for ArtifactError {
	fn from(err: reqwest::Error) -> Self {
		ArtifactError::S3HeadRequest(err)
	}
}

impl From<url::ParseError> for UpdaterError {
	fn from(err: url::ParseError) -> Self {
		UpdaterError::Parse(err)
	}
}

pub fn report(mut err: &dyn std::error::Error) -> String {
	use std::fmt::Write;

	let mut s = format!("{err}");
	while let Some(src) = err.source() {
		let _ = write!(s, "\n\ncaused by: {src}");
		err = src;
	}
	s
}

impl IntoResponse for UpdaterError {
	fn into_response(self) -> Response {
		let status = match self {
			UpdaterError::UpdateNotFound { .. } => axum::http::StatusCode::NOT_FOUND,
			UpdaterError::InstallerNotFound(_) => axum::http::StatusCode::NOT_FOUND,
			UpdaterError::S3NotFound(_) => axum::http::StatusCode::NOT_FOUND,
			UpdaterError::FailedToFetchUpdate(_) => axum::http::StatusCode::BAD_GATEWAY,
			UpdaterError::Parse(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
			UpdaterError::InvalidPlatformPackagePair(_) => axum::http::StatusCode::BAD_REQUEST,
			UpdaterError::FailedToBuildResponse(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
			UpdaterError::S3FailedToFetch(_) => axum::http::StatusCode::BAD_GATEWAY,
			UpdaterError::NoUpdateRequired => axum::http::StatusCode::NO_CONTENT,
		};

		(status, self.to_string()).into_response()
	}
}

pub struct UpdateErrorNotFoundBuilder {
	pub channel: Channel,
	pub platform: Option<PlatformPackage>,
	pub version: Option<Version>,
}

impl UpdaterError {
	pub fn not_found(channel: Channel) -> UpdateErrorNotFoundBuilder {
		UpdateErrorNotFoundBuilder {
			channel,
			platform: None,
			version: None,
		}
	}
}

impl UpdateErrorNotFoundBuilder {
	pub fn platform(mut self, platform: PlatformPackage) -> Self {
		self.platform = Some(platform);
		self
	}

	pub fn version(mut self, version: Version) -> Self {
		self.version = Some(version);
		self
	}

	pub fn build(self) -> UpdaterError {
		UpdaterError::UpdateNotFound {
			channel: self.channel,
			platform: self.platform,
			version: self.version.unwrap_or(Version::Latest),
		}
	}
}
