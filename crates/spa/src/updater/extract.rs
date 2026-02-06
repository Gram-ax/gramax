use axum::extract::rejection::PathRejection;
use axum::extract::rejection::QueryRejection;
use axum::extract::FromRequestParts;
use axum::extract::Path;
use axum::extract::Query;
use axum::http::request::Parts;
use axum::response::IntoResponse;
use axum::response::Response;
use serde::Deserialize;

use crate::updater;
use crate::updater::artifacts::error::PackageError;
use crate::updater::Channel;
use crate::updater::Package;
use crate::updater::Platform;
use crate::updater::Version;

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub struct ParamsQuery {
	#[serde(default)]
	pub channel: Channel,
	pub package: Option<Package>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub struct AppVersionQuery {
	pub version: Version,
}

#[derive(thiserror::Error, Debug)]
pub enum ExtractError {
	#[error("failed to parse package")]
	InvalidPackage(PackageError),

	#[error(transparent)]
	Query(QueryRejection),

	#[error(transparent)]
	Path(PathRejection),
}

impl From<PackageError> for ExtractError {
	fn from(e: PackageError) -> Self {
		ExtractError::InvalidPackage(e)
	}
}

impl IntoResponse for ExtractError {
	fn into_response(self) -> Response {
		match self {
			ExtractError::InvalidPackage(e) => (axum::http::StatusCode::BAD_REQUEST, e.to_string()).into_response(),
			ExtractError::Query(e) => e.into_response(),
			ExtractError::Path(e) => e.into_response(),
		}
	}
}

pub struct ExtractPlatformPackage(pub updater::PlatformPackage, pub Channel);

impl<S: Send + Sync> FromRequestParts<S> for ExtractPlatformPackage {
	type Rejection = ExtractError;

	async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
		let q = Query::<ParamsQuery>::from_request_parts(parts, state)
			.await
			.map_err(ExtractError::Query)?;
		let platform = Path::<Platform>::from_request_parts(parts, state).await.map_err(ExtractError::Path)?;

		let package = match q.package {
			Some(package) => Some(package),
			None => match parts.headers.get("x-gx-package").and_then(|v| v.to_str().ok()) {
				Some("unknown") => None,
				Some(p) => Some(p.parse::<Package>()?),
				None => None,
			},
		};

		let platform = updater::PlatformPackage::from_maybe_pair(*platform, package)?;

		let channel = q.channel;

		Ok(ExtractPlatformPackage(platform, channel))
	}
}

pub struct ExtractAppVersion(pub semver::Version);

impl<S: Send + Sync> FromRequestParts<S> for ExtractAppVersion {
	type Rejection = ExtractError;

	async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
		let app_version: semver::Version = parts
			.headers
			.get("x-gx-app-version")
			.and_then(try_parse_version)
			.unwrap_or(semver::Version::new(0, 0, 0));

		Ok(ExtractAppVersion(app_version))
	}
}

pub struct ExtractDesiredAppVersion(pub Option<semver::Version>);

impl<S: Send + Sync> FromRequestParts<S> for ExtractDesiredAppVersion {
	type Rejection = ExtractError;

	async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
		let desired_app_version = parts.headers.get("x-gx-desired-app-version").and_then(try_parse_version);

		Ok(ExtractDesiredAppVersion(desired_app_version))
	}
}

fn try_parse_version(val: &axum::http::HeaderValue) -> Option<semver::Version> {
	val.to_str().ok().and_then(|v| v.parse::<semver::Version>().ok()).map(|v| {
		if v.pre.contains('.') {
			let split = v.pre.split_once('.').unwrap_or(("", v.pre.as_str()));
			let pre = semver::Prerelease::new(split.1).unwrap();
			semver::Version { pre, ..v }
		} else {
			v
		}
	})
}
