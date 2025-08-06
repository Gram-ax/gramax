use std::path::PathBuf;

use axum::extract::Request;
use axum::http::HeaderValue;
use axum::response::Response;
use axum::routing::get;
use axum::Router;

use axum::middleware;
use axum::middleware::Next;

use axum_extra::response::JavaScript;
use tower_http::services::ServeDir;
use tower_http::services::ServeFile;

use tracing::*;

use crate::metrics::layers::Metrics;

pub fn serve_static_assets(dir: PathBuf, fallback: Option<PathBuf>, metrics: Metrics) -> Router {
  let env = static_prepare_env()
    .inspect_err(|err| error!("static env gen err: {:#?}; /env.js will not be available", err))
    .unwrap_or_default();

  Router::new()
    .merge(serve_dir(dir, fallback))
    .route("/env.js", get(async move || JavaScript(env)))
    .layer(middleware::from_fn(set_headers))
    .layer(middleware::from_fn_with_state(metrics, crate::metrics::layers::static_assets_metrics))
}

fn serve_dir(dir: PathBuf, fallback: Option<PathBuf>) -> Router {
  let serve_file = fallback.map(|f| ServeFile::new(dir.join(f)).precompressed_br().precompressed_gzip());
  let serve_dir = ServeDir::new(&dir).precompressed_gzip().precompressed_br();

  let router = Router::new();

  match serve_file {
    Some(serve_file) => router.fallback_service(serve_dir.fallback(serve_file)),
    None => router.fallback_service(serve_dir),
  }
}

fn static_prepare_env() -> Result<Vec<u8>, std::io::Error> {
  let script = include_str!(concat!(env!("OUT_DIR"), "/static_env.js"));
  let generated = std::process::Command::new("bun").arg("-p").arg(script).output()?;
  Ok(generated.stdout)
}

async fn set_headers(req: Request, next: Next) -> Response {
  let mut response = next.run(req).await;
  let headers = response.headers_mut();

  headers.insert("cache-control", HeaderValue::from_static("public, max-age=3600"));
  headers.insert("cross-origin-embedder-policy", HeaderValue::from_static("require-corp"));
  headers.insert("cross-origin-opener-policy", HeaderValue::from_static("same-origin"));

  response
}
