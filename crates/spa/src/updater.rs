use std::collections::HashMap;
use std::ops::Deref;
use std::sync::Arc;
use std::time::Duration;

use axum::body::Body;
use axum::extract::Path;
use axum::extract::Query;
use axum::extract::State;
use axum::http::HeaderValue;
use axum::http::Uri;
use axum::middleware;
use axum::response::IntoResponse;
use axum::response::Response;
use axum::routing::get;
use axum::Json;
use axum::Router;

use serde::Serialize;
use tokio::sync::RwLock;
use tokio::time::Instant;

use serde::Deserialize;
use tower::ServiceBuilder;

use crate::logging::Report;
use crate::metrics::layers::Metrics;

use tracing::*;

const UPDATE_FETCH_INTERVAL: Duration = Duration::from_secs(60);

#[derive(thiserror::Error, Debug)]
pub enum UpdaterError {
  #[error("release not found for channel: {0}")]
  ReleaseNotFound(Channel),
  #[error("failed to fetch update: {}", report(&.0))]
  FailedToFetchUpdate(#[from] reqwest::Error),
  #[error("file not found at upstream s3 server: {0}")]
  S3NotFound(String),
  #[error("failed to fetch file from upstream s3 server: {}", report(&.0))]
  S3FailedToFetch(reqwest::Error),
  #[error("failed to build response: {}", report(&.0))]
  FailedToBuildResponse(axum::http::Error),
}

fn report(mut err: &dyn std::error::Error) -> String {
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
      UpdaterError::ReleaseNotFound(_) => axum::http::StatusCode::NOT_FOUND,
      UpdaterError::S3NotFound(_) => axum::http::StatusCode::NOT_FOUND,
      UpdaterError::FailedToFetchUpdate(_) => axum::http::StatusCode::BAD_GATEWAY,
      UpdaterError::S3FailedToFetch(_) => axum::http::StatusCode::BAD_GATEWAY,
      UpdaterError::FailedToBuildResponse(_) => axum::http::StatusCode::INTERNAL_SERVER_ERROR,
    };

    (status, self.to_string()).into_response()
  }
}

#[derive(Clone)]
struct AppState {
  release_cache: Arc<ReleaseCache>,
}

#[derive(Clone, Debug)]
pub struct S3BaseUrl(Uri);

impl Deref for S3BaseUrl {
  type Target = Uri;
  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

#[derive(Serialize, Deserialize, Hash, Eq, PartialEq, Default, Debug, Clone, Copy)]
#[serde(rename_all = "lowercase")]
pub enum Channel {
  #[default]
  Prod,
  Dev,
  Mobile,
}

impl std::fmt::Display for Channel {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Channel::Prod => write!(f, "prod"),
      Channel::Dev => write!(f, "dev"),
      Channel::Mobile => write!(f, "mobile"),
    }
  }
}

#[derive(Serialize, Deserialize, Hash, Eq, PartialEq, Clone, Debug)]
pub enum Platform {
  #[serde(rename = "windows-x86_64", alias = "win")]
  WindowsX86_64,
  #[serde(rename = "darwin-x86_64", alias = "mac-intel")]
  DarwinX86_64,
  #[serde(rename = "darwin-aarch64", alias = "mac-silicon")]
  DarwinAarch64,
  #[serde(rename = "linux-x86_64", alias = "linux")]
  Linux,
  #[serde(rename = "android", alias = "android")]
  Android,
  #[serde(rename = "ios", alias = "ios")]
  Ios,
}

impl std::fmt::Display for Platform {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Platform::WindowsX86_64 => write!(f, "windows-x86_64"),
      Platform::DarwinX86_64 => write!(f, "darwin-x86_64"),
      Platform::DarwinAarch64 => write!(f, "darwin-aarch64"),
      Platform::Linux => write!(f, "linux-x86_64"),
      Platform::Android => write!(f, "android"),
      Platform::Ios => write!(f, "ios"),
    }
  }
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug)]
pub enum Bucket {
  #[serde(rename = "updates")]
  Updates,
  #[serde(rename = "downloads")]
  Downloads,
}

impl std::fmt::Display for Bucket {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Bucket::Updates => write!(f, "updates"),
      Bucket::Downloads => write!(f, "downloads"),
    }
  }
}

impl Channel {
  fn as_str_legacy(&self) -> &str {
    match self {
      Channel::Prod => "release",
      Channel::Dev => "dev",
      Channel::Mobile => "mobile-dev",
    }
  }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Release {
  #[serde(rename = "version", alias = "current")]
  pub version: String,
  #[serde(rename = "pub_date")]
  pub pub_date: Option<String>,
  #[serde(alias = "platforms")]
  pub platforms: HashMap<Platform, PlatformInfo>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PlatformInfo {
  pub signature: String,
  #[serde(rename = "url", skip_serializing)]
  pub url_raw: String,
  #[serde(skip_serializing)]
  pub url_installer: Option<String>,
  #[serde(rename = "url", skip_deserializing)]
  pub url_updater: String,
}

pub struct ReleaseCache {
  last_time_fetched: RwLock<Instant>,
  host: Arc<Uri>,
  s3_base_url: S3BaseUrl,
  artifacts: Arc<RwLock<HashMap<Channel, Release>>>,
}

impl ReleaseCache {
  fn new(updater_host: Uri, s3_base_url: S3BaseUrl) -> Self {
    Self {
      last_time_fetched: RwLock::new(Instant::now()),
      host: Arc::new(updater_host),
      s3_base_url,
      artifacts: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  #[tracing::instrument(skip(self))]
  async fn get(&self, bucket: Bucket, channel: Channel) -> Result<Release, UpdaterError> {
    let last_time_fetched = self.last_time_fetched.read().await;

    if last_time_fetched.elapsed() > UPDATE_FETCH_INTERVAL || self.artifacts.read().await.is_empty() {
      self.update().await.map_err(UpdaterError::FailedToFetchUpdate)?;
    }

    let release = match bucket {
      Bucket::Updates => self.artifacts.read().await.get(&channel).cloned(),
      Bucket::Downloads => self.artifacts.read().await.get(&channel).cloned(),
    };

    release.ok_or(UpdaterError::ReleaseNotFound(channel))
  }

  async fn update(&self) -> Result<(), reqwest::Error> {
    for channel in [Channel::Prod, Channel::Dev] {
      let s3_base_url = self.s3_base_url.0.to_string();
      let s3_base_url = s3_base_url.trim_end_matches('/');
      let endpoint = format!("{}/{}/x-updates.json", s3_base_url, channel.as_str_legacy());
      let res = reqwest::get(endpoint).await?;
      let Ok(mut update) = res.json::<Release>().await.report_if_err() else { continue };

      for (platform, info) in update.platforms.iter_mut() {
        let host = self.host.to_string();
        let host = host.trim_end_matches('/');
        let update_bucket = Bucket::Updates;

        info.url_updater = format!("{host}/{update_bucket}/{platform}?channel={channel}");
      }

      info!("fetched update for channel {}: {:#?}", channel, update);

      self.artifacts.write().await.insert(channel, update.clone());
    }

    Ok(())
  }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
struct ParamsQuery {
  #[serde(default)]
  channel: Channel,
}

pub fn updater(updater_host: Uri, s3_base_url: Uri, metrics: Metrics) -> Router {
  let s3_base_url = S3BaseUrl(s3_base_url);

  let update_check_middleware = ServiceBuilder::new()
    .layer(middleware::from_fn(crate::metrics::layers::insert_metrics_user_action_update_check))
    .layer(middleware::from_fn_with_state(metrics.clone(), crate::metrics::layers::updater_metrics));

  let download_middleware = ServiceBuilder::new()
    .layer(middleware::from_fn(crate::metrics::layers::insert_metrics_user_action_download))
    .layer(middleware::from_fn_with_state(metrics.clone(), crate::metrics::layers::updater_metrics));

  Router::new()
    .route("/updates", get(get_updates).layer(update_check_middleware))
    .route("/{bucket}/{platform}", get(stream_download).layer(download_middleware))
    .with_state(AppState { release_cache: Arc::new(ReleaseCache::new(updater_host, s3_base_url)) })
}

async fn get_updates(
  State(AppState { release_cache, .. }): State<AppState>,
  Query(q): Query<ParamsQuery>,
) -> Result<Json<Release>, UpdaterError> {
  let releases = release_cache.get(Bucket::Updates, q.channel).await.report_if_err()?;
  Ok(Json(releases))
}

async fn stream_download(
  State(AppState { release_cache, .. }): State<AppState>,
  Path((bucket, platform)): Path<(Bucket, Platform)>,
  Query(q): Query<ParamsQuery>,
) -> Result<Response, UpdaterError> {
  let releases = release_cache.get(bucket, q.channel).await.report_if_err()?;

  let info = match releases.platforms.get(&platform) {
    Some(platform) => platform,
    None => return Err(UpdaterError::ReleaseNotFound(q.channel)),
  };

  let endpoint = match bucket {
    Bucket::Updates => info.url_raw.clone(),
    Bucket::Downloads => info.url_installer.as_ref().unwrap_or(&info.url_raw).clone(),
  };

  let filename = match bucket {
    Bucket::Updates => info.url_raw.split('/').next_back(),
    Bucket::Downloads => info.url_installer.as_ref().and_then(|s| s.split('/').next_back()),
  };

  let s3_res = reqwest::get(&endpoint).await.report_if_err().map_err(UpdaterError::S3FailedToFetch)?;

  if s3_res.status() == reqwest::StatusCode::NOT_FOUND {
    return Err(UpdaterError::S3NotFound(endpoint));
  }

  let headers = s3_res.headers().clone();

  let mut res = Response::builder()
    .status(s3_res.status())
    .body(Body::from_stream(s3_res.bytes_stream()))
    .map_err(UpdaterError::FailedToBuildResponse)
    .report_if_err()?;

  *res.headers_mut() = headers;

  if let Some(filename) = filename {
    let value = format!("attachment; filename=\"{filename}\"");
    res.headers_mut().insert("Content-Disposition", HeaderValue::from_str(&value).unwrap());
  }

  Ok(res)
}
