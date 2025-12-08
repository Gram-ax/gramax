use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;

use axum::extract::ConnectInfo;
use axum::extract::Request;
use axum::http::HeaderValue;
use axum::middleware;
use axum::middleware::Next;
use axum::response::Redirect;
use axum::response::Response;
use axum::routing::get;
use axum::Router;

use clap::Parser;
use reqwest::Url;
use tower_http::trace::TraceLayer;

use tracing::*;

use crate::metrics::doc::MetricDoc;
use crate::metrics::layers::Metrics;

use spa::*;

#[derive(clap::Parser, Clone, Debug)]
pub enum Mode {
  Static {
    #[arg(short, long = "dir", env = "DIR", default_value = ".")]
    dir: PathBuf,

    #[arg(short, long = "fallback", env = "FALLBACK", default_value = "index.html")]
    fallback: Option<PathBuf>,
  },
  Updater {
    #[arg(long = "s3", env = "S3_BASE_URL")]
    s3_base_url: Url,
  },
}

impl std::fmt::Display for Mode {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Mode::Static { dir, fallback } => write!(
        f,
        "static spa server (dir: {}; fallback: {})",
        dir.display(),
        fallback.as_ref().map(|p| p.display().to_string()).unwrap_or_else(|| "none".to_string())
      ),
      Mode::Updater { s3_base_url } => write!(f, "updater server (s3: {s3_base_url})"),
    }
  }
}

#[derive(clap::Parser, Clone, Debug)]
pub struct Options {
  #[clap(subcommand)]
  mode: Mode,

  #[arg(long = "ip", env = "IP", default_value = "0.0.0.0")]
  addr: String,

  #[arg(short, long = "port", env = "PORT", default_value = "80")]
  port: u16,

  #[arg(long = "redirect404", env = "REDIRECT_404")]
  redirect_404: Option<Url>,

  #[arg(long = "cookie-domain", env = "COOKIE_DOMAIN")]
  cookie_domain: Option<String>,

  #[arg(long = "enable-health-probe", env = "ENABLE_HEALTH_PROBE", default_value = "false")]
  enable_health_probe: bool,

  #[clap(flatten)]
  es: metrics::exporter::ElasticOptions,
}

#[tokio::main]
async fn main() {
  logging::init();
  let trace = TraceLayer::new_for_http()
    .make_span_with(logging::make_span)
    .on_response(logging::on_response)
    .on_failure(logging::on_failure);

  let opts = Options::parse();

  let metrics_sender = init_metrics(opts.es)
    .await
    .inspect_err(|err| error!("failed to init metrics: {:#?}", err))
    .unwrap_or_else(|_| init_metrics_fallback());

  let mode_str = opts.mode.to_string();

  let metrics = Metrics { cookie_domain: Arc::new(opts.cookie_domain), sender: metrics_sender.clone() };

  let router = Router::new();

  let router = match opts.mode {
    Mode::Static { dir, fallback } => {
      router.merge(static_assets::serve_static_assets(dir, fallback, metrics.clone()))
    }
    Mode::Updater { s3_base_url } => {
      let updater = updater::Updater { s3_base_url, metrics: metrics.clone() }.into_router();
      router.merge(updater)
    }
  }
  .route("/robots.txt", get(|| async { "User-agent: *\nDisallow: /" }))
  .layer(middleware::from_fn(set_xreal_ip_if_none))
  .layer(trace);

  let router = match opts.redirect_404 {
    Some(redirect_404) => router.fallback(async move || Redirect::permanent(redirect_404.as_ref())),
    _ => router,
  };

  let router = if opts.enable_health_probe { router.merge(healthprobe::healthprobe()) } else { router };

  let listener = tokio::net::TcpListener::bind(format!("{}:{}", opts.addr, opts.port)).await.unwrap();
  info!("listening on {} as {}", listener.local_addr().unwrap(), mode_str);

  let server = axum::serve(listener, router.into_make_service_with_connect_info::<SocketAddr>())
    .with_graceful_shutdown(on_shutdown());

  server.await.unwrap();
}

async fn set_xreal_ip_if_none(
  ConnectInfo(addr): ConnectInfo<SocketAddr>,
  mut req: Request,
  next: Next,
) -> Response {
  if req.headers().get("x-real-ip").is_none() {
    let ip = addr.ip();
    req.headers_mut().insert("x-real-ip", HeaderValue::from_str(&ip.to_string()).unwrap());
  }

  next.run(req).await
}

async fn init_metrics(
  opts: metrics::exporter::ElasticOptions,
) -> Result<metrics::exporter::MetricSender<MetricDoc>, anyhow::Error> {
  use metrics::exporter::*;

  let exporter = MetricExporterCollection::<MetricDoc>::default();

  #[cfg(debug_assertions)]
  let exporter = exporter.with_exporter(AnyMetricExporter::stdout());

  let exporter = match opts.es_url {
    Some(_) => exporter.with_exporter(AnyMetricExporter::elasticsearch(opts).await?),
    None => exporter,
  };

  Ok(metrics::exporter::MetricSender::new(exporter))
}

fn init_metrics_fallback() -> metrics::exporter::MetricSender<MetricDoc> {
  use metrics::exporter::*;

  warn!("using fallback metrics exporter");
  let exporter = MetricExporterCollection::<MetricDoc>::default();
  let exporter = exporter.with_exporter(AnyMetricExporter::stdout());
  metrics::exporter::MetricSender::new(exporter)
}

async fn on_shutdown() {
  let ctrl_c = async { tokio::signal::ctrl_c().await.expect("failed to install Ctrl+C handler") };

  #[cfg(unix)]
  let terminate = async {
    tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
      .expect("failed to install signal handler")
      .recv()
      .await
  };

  #[cfg(not(unix))]
  let terminate = std::future::pending::<()>();

  tokio::select! {
    _ = ctrl_c => {},
    _ = terminate => {},
  }

  info!("signal received, shutting down");
}
