use crate::updater::package::PlatformPackage;
use crate::updater::report;
use crate::updater::Package;
use crate::updater::Platform;

#[derive(thiserror::Error, Debug)]
pub enum ArtifactUpdateError {
  #[error(".version file etag for {0} mismatch; needs update")]
  NeedsUpdate(PlatformPackage),

  #[error("not found")]
  NotFound,

  #[error("failed to build request: {}", report(&.0))]
  BuildRequest(reqwest::Error),

  #[error("failed check etag by sending a head request to an upstream s3 server: {}", report(&.0))]
  CheckEtag(reqwest::Error),

  #[error("failed to get latest version from an upstream s3 server: {}", report(&.0))]
  LatestFetchFailed(reqwest::Error),

  #[error("failed to fetch update ({}): {}", &.0, report(&.1))]
  FetchFailed(semver::Version, reqwest::Error),

  #[error("upstream s3 server sent an invalid {0} header or missing it")]
  InvalidOrMissingHeader(&'static str),

  #[error("failed to get artifact metadata: {}", report(&.0))]
  GetArtifactMetadata(reqwest::Error),

  #[error("failed to parse version: {}", report(&.0))]
  InvalidVersion(semver::Error),
}

#[derive(thiserror::Error, Debug)]
pub enum PackageError {
  #[error("invalid platform package pair: {0} & {1}")]
  InvalidPlatformPackagePair(Platform, Package),

  #[error("unknown package: {0}")]
  UnknownPackage(String),
}
