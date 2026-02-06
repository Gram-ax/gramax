use std::collections::HashMap;

use axum::body::Body;
use axum::http::HeaderValue;
use axum::response::Response;

use axum::extract::Query;
use axum::extract::State;
use axum::middleware;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;

use tower::ServiceBuilder;

use crate::logging::Report;
use crate::metrics::layers::Metrics;
use crate::updater::error::UpdaterError;
use crate::updater::extract::ExtractAppVersion;
use crate::updater::extract::ExtractDesiredAppVersion;
use crate::updater::extract::ExtractPlatformPackage;
use crate::updater::extract::ParamsQuery;
use crate::updater::package::Platform;
use crate::updater::*;

pub struct Updater {
	pub s3_base_url: Url,
	pub metrics: Metrics,
}

impl Updater {
	pub fn into_router(self) -> Router {
		let Updater { s3_base_url, metrics } = self;

		let artifacts = ArtifactStore::new(S3BaseUrl(s3_base_url));

		let all_updates_check_middleware =
			ServiceBuilder::new().layer(middleware::from_fn(crate::metrics::layers::insert_metrics_user_action_check_updates));

		let update_check_middleware = ServiceBuilder::new().layer(middleware::from_fn(
			crate::metrics::layers::insert_metrics_user_action_check_single_update,
		));

		let download_middleware = ServiceBuilder::new().layer(middleware::from_fn(crate::metrics::layers::insert_metrics_user_action_download));

		Router::new()
			.layer(middleware::from_fn_with_state(metrics.clone(), crate::metrics::layers::updater_metrics))
			.route("/updates", get(get_all_updates).layer(all_updates_check_middleware))
			.route("/{platform}/updates", get(get_update).layer(update_check_middleware))
			.route("/download/{platform}", get(stream_download).layer(download_middleware.clone()))
			.route("/{platform}", get(stream_download).layer(download_middleware))
			.with_state(AppState { artifacts })
	}
}

async fn get_all_updates(State(AppState { artifacts }): State<AppState>, Query(q): Query<ParamsQuery>) -> Result<Json<Release>, UpdaterError> {
	let platforms = [Platform::WindowsX86_64, Platform::DarwinX86_64, Platform::DarwinAarch64, Platform::Linux];
	let channel = artifacts.channel(q.channel);

	channel
		.update_latest_if_needed(None)
		.await
		.report_if_err()
		.map_err(UpdaterError::FailedToFetchUpdate)?;

	let mut updates = HashMap::new();
	let mut metadata: (Option<semver::Version>, Option<time::OffsetDateTime>) = (None, None);

	for platform in platforms {
		let platform_package = PlatformPackage::from_platform_default(platform);

		let update = channel
			.get_latest_update(platform_package)
			.await
			.report_if_err()
			.map_err(|_| UpdaterError::not_found(q.channel).platform(platform_package).build())?;

		match metadata {
			(Some(ref version), _) => {
				if version > &update.version {
					metadata = (Some(update.version), Some(update.pub_date));
				}
			}
			(None, None) => {
				metadata = (Some(update.version), Some(update.pub_date));
			}
			_ => {}
		}

		updates.insert(
			platform,
			PlatformInfo {
				url: update.s3_url.to_string(),
				signature: update.signature,
			},
		);
	}

	if updates.is_empty() {
		return Err(UpdaterError::not_found(q.channel).build());
	}

	Ok(Json(Release {
		version: metadata.0.ok_or(UpdaterError::not_found(q.channel).build())?,
		pub_date: metadata.1.ok_or(UpdaterError::not_found(q.channel).build())?,
		platforms: updates,
	}))
}

async fn get_update(
	State(AppState { artifacts }): State<AppState>,
	ExtractPlatformPackage(platform, update_channel): ExtractPlatformPackage,
	ExtractAppVersion(app_version): ExtractAppVersion,
	ExtractDesiredAppVersion(desired_app_version): ExtractDesiredAppVersion,
) -> Result<Json<Update>, UpdaterError> {
	let channel = artifacts.channel(update_channel);

	let update = match desired_app_version {
		Some(desired_version) => {
			if desired_version == app_version {
				return Err(UpdaterError::NoUpdateRequired);
			}

			channel
				.get_latest_update_by_version(desired_version.clone(), platform)
				.await
				.report_if_err()
				.map_err(|_| {
					UpdaterError::not_found(update_channel)
						.platform(platform)
						.version(Version::Exact(desired_version))
						.build()
				})?
		}
		_ => {
			channel
				.update_latest_if_needed(Some(platform))
				.await
				.report_if_err()
				.map_err(UpdaterError::FailedToFetchUpdate)?;

			let update = channel
				.get_latest_update(platform)
				.await
				.report_if_err()
				.map_err(|_| UpdaterError::not_found(update_channel).platform(platform).build())?;

			if update.version == app_version {
				return Err(UpdaterError::NoUpdateRequired);
			}

			update
		}
	};

	let update = Update {
		version: update.version,
		pub_date: update.pub_date,
		url: update.s3_url,
		signature: update.signature,
		notes: None,
	};

	Ok(Json(update))
}

async fn stream_download(
	State(AppState { artifacts }): State<AppState>,
	ExtractPlatformPackage(platform, channel): ExtractPlatformPackage,
) -> Result<impl IntoResponse, UpdaterError> {
	let channel = artifacts.channel(channel);

	channel
		.update_latest_if_needed(Some(platform))
		.await
		.report_if_err()
		.map_err(UpdaterError::FailedToFetchUpdate)?;

	let (url, version) = channel
		.latest_installer_download_url(platform)
		.await
		.report_if_err()
		.map_err(|_| UpdaterError::InstallerNotFound(platform))?;

	let s3_res = reqwest::get(url.clone()).await.report_if_err().map_err(UpdaterError::S3FailedToFetch)?;

	if s3_res.status() == reqwest::StatusCode::NOT_FOUND {
		return Err(UpdaterError::S3NotFound(url.to_string()));
	}

	let headers = s3_res.headers().clone();

	let mut res = Response::builder()
		.status(s3_res.status())
		.body(Body::from_stream(s3_res.bytes_stream()))
		.map_err(UpdaterError::FailedToBuildResponse)
		.report_if_err()?;

	*res.headers_mut() = headers;

	let filename = platform.filename(&version);
	let value = format!("attachment; filename=\"{filename}\"");
	res.headers_mut().insert("Content-Disposition", HeaderValue::from_str(&value).unwrap());

	Ok(res)
}
