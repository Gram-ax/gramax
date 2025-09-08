use std::path::PathBuf;

use tracing_subscriber::filter::FilterFn;
use tracing_subscriber::fmt::MakeWriter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::Layer;

use tauri::*;

const MAX_FILE_COUNT: usize = 10;

pub fn init<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
  let filter = tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_default();
  tracing_subscriber::registry()
    .with(filter)
    .with(stderr())
    .with(dir_json(app.path().app_data_dir()?.join("logs"), MAX_FILE_COUNT)?)
    .with(webview(app.clone()))
    .init();

  Ok(())
}

fn stderr<S>() -> impl Layer<S>
where
  S: tracing::Subscriber,
  for<'a> S: tracing_subscriber::registry::LookupSpan<'a>,
{
  let layer = tracing_subscriber::fmt::layer().with_writer(std::io::stderr).pretty();

  #[cfg(not(debug_assertions))]
  let layer = layer.with_timer(tracing_subscriber::fmt::time::LocalTime::rfc_3339());

  #[cfg(debug_assertions)]
  let layer = layer.without_time();

  layer
}

fn dir_json<S>(dir: PathBuf, max_file_count: usize) -> std::io::Result<impl Layer<S>>
where
  S: tracing::Subscriber,
  for<'a> S: tracing_subscriber::registry::LookupSpan<'a>,
{
  std::fs::create_dir_all(&dir)?;

  for file in std::fs::read_dir(&dir)?.skip(max_file_count) {
    let file = file?;
    if file.file_type()?.is_dir() {
      std::fs::remove_dir_all(file.path())?;
    } else {
      std::fs::remove_file(file.path())?;
    }
  }

  let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
  let log_path = dir.join(format!("gx-log-{now}.json"));
  let symlink_path = dir.join("gx-log-latest.json");

  let file = std::fs::File::options().append(true).create(true).open(&log_path)?;

  _ = std::fs::remove_file(&symlink_path);
  std::fs::hard_link(&log_path, &symlink_path)?;

  Ok(tracing_subscriber::fmt::layer().with_ansi(false).pretty().json().flatten_event(true).with_writer(file))
}

struct WebviewLogFmt<R: Runtime> {
  app: AppHandle<R>,
}

impl<'a, R: Runtime> MakeWriter<'a> for WebviewLogFmt<R> {
  type Writer = WebviewLogFmt<R>;

  fn make_writer(&self) -> Self::Writer {
    WebviewLogFmt { app: self.app.clone() }
  }

  fn make_writer_for(&self, _: &tracing::Metadata<'_>) -> Self::Writer {
    WebviewLogFmt { app: self.app.clone() }
  }
}

impl<R: Runtime> std::io::Write for WebviewLogFmt<R> {
  fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
    self.app.emit("log", str::from_utf8(buf).unwrap()).unwrap();
    Ok(buf.len())
  }

  fn flush(&mut self) -> std::io::Result<()> {
    Ok(())
  }
}

fn webview<S, R: Runtime>(app: AppHandle<R>) -> impl Layer<S>
where
  S: tracing::Subscriber,
  for<'a> S: tracing_subscriber::registry::LookupSpan<'a>,
{
  let webview_filter = FilterFn::new(|metadata| {
    if metadata.name() == "js" || metadata.name() == "arg" || metadata.name() == "msg" {
      return false;
    }

    if metadata.target() == "js" || metadata.target() == "arg" || metadata.target() == "msg" {
      return false;
    }

    true
  });

  tracing_subscriber::fmt::layer()
    .with_ansi(false)
    .compact()
    .without_time()
    .json()
    .with_file(true)
    .flatten_event(true)
    .with_writer(WebviewLogFmt { app })
    .with_filter(webview_filter)
    .boxed()
}

#[derive(serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum JsLogLevel {
  Info,
  Warn,
  Error,
  Debug,
  Trace,
}

#[command]
pub fn js_log<R: Runtime>(
  window: WebviewWindow<R>,
  level: JsLogLevel,
  message: String,
  data: Vec<String>,
) -> Result<()> {
  let label = window.label();
  let url = window.url()?;

  let span = span!(tracing::Level::INFO, "js", id = nanoid::nanoid!(4), w = %label, url = %url);
  let _enter = span.enter();

  if data.is_empty() {
    match level {
      JsLogLevel::Info => tracing::info!(target: "js", message),
      JsLogLevel::Warn => tracing::warn!(target: "js", message),
      JsLogLevel::Error => tracing::error!(target: "js", message),
      JsLogLevel::Debug => tracing::debug!(target: "js", message),
      JsLogLevel::Trace => tracing::trace!(target: "js", message),
    };

    return Ok(());
  }

  for (idx, data) in data.into_iter().enumerate() {
    let data = match serde_json::from_str::<serde_json::Value>(&data) {
      Ok(parsed) => serde_json::to_string_pretty(&parsed).unwrap_or(data).trim().to_string(),
      Err(_) => data,
    };

    match level {
      JsLogLevel::Info => tracing::info!(target: "arg", idx, %data),
      JsLogLevel::Warn => tracing::warn!(target: "arg", idx, %data),
      JsLogLevel::Error => tracing::error!(target: "arg", idx, %data),
      JsLogLevel::Debug => tracing::debug!(target: "arg", idx, %data),
      JsLogLevel::Trace => tracing::trace!(target: "arg", idx, %data),
    };
  }

  Ok(())
}
