use std::path::PathBuf;
use sysinfo::Pid;
use sysinfo::ProcessRefreshKind;
use sysinfo::ProcessesToUpdate;
use tracing::level_filters::LevelFilter;
use tracing_subscriber::filter::FilterFn;
use tracing_subscriber::fmt::MakeWriter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::Layer;

use tauri::*;

use crate::memory::MemoryInfo;
use crate::memory::ProcessMemoryInfo;

const MAX_FILE_COUNT: usize = 10;

pub fn init<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
  let filter = tracing_subscriber::EnvFilter::try_from_default_env()
    .unwrap_or(EnvFilter::builder().with_default_directive(LevelFilter::INFO.into()).from_env_lossy());

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
  let layer = tracing_subscriber::fmt::layer().with_writer(std::io::stderr).pretty().with_thread_ids(true);

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

  Ok(
    tracing_subscriber::fmt::layer()
      .with_ansi(false)
      .pretty()
      .with_thread_ids(true)
      .json()
      .flatten_event(true)
      .with_writer(file),
  )
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

struct FmtProcessInfo<'m>(&'m MemoryInfo);

impl std::fmt::Display for FmtProcessInfo<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    let opts = humansize::FormatSizeOptions::default()
      .space_after_value(true)
      .long_units(false)
      .units(humansize::Kilo::Binary);

    writeln!(
      f,
      "total rss: {}, total cpu: {:.2}%, total open files: {}",
      humansize::format_size(self.0.total_rss(), opts),
      self.0.total_cpu_usage(),
      self.0.total_open_files(),
    )?;

    for p in self.0 .0.iter() {
      let name = match p {
        ProcessMemoryInfo::Webview { wv_label, .. } => {
          format!("{} (wv)", wv_label)
        }
        ProcessMemoryInfo::WebviewChild { parent_wv_label, .. } => {
          format!("{} (wv child)", parent_wv_label)
        }
        p => p.name().to_string(),
      };

      writeln!(
        f,
        "{} (pid {}{}{}): rss {}, vm {}, cpu {:.2}%, open files {}; run for: {:?}",
        name,
        p.pid(),
        p.parent_pid().map(|p| format!(", parent pid {}", p)).unwrap_or("".to_string()),
        if p.is_main() { ", main" } else { "" },
        humansize::format_size(p.rss(), opts),
        humansize::format_size(p.virtual_memory(), opts),
        p.cpu_usage(),
        p.open_files(),
        std::time::Duration::from_secs(p.run()),
      )?;
    }

    writeln!(f)?;

    Ok(())
  }
}

pub fn watch_process<R: Runtime>(app: AppHandle<R>) {
  std::thread::spawn(move || loop {
    let pid = std::process::id();
    let mut system = bugsnag::sysinfo::System::new_all();

    std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
    system.refresh_processes_specifics(
      ProcessesToUpdate::All,
      true,
      ProcessRefreshKind::nothing().with_cpu(),
    );

    let mut memory_info = MemoryInfo::default();

    memory_info.feed_process(Pid::from(pid as usize), &system);

    for window in app.webview_windows().iter() {
      if let Err(e) = memory_info.feed_webview(window.1, &system) {
        warn!("failed to get webview memory info: {}", e);
      }
    }

    memory_info.0.sort_by_key(|a| a.pid());
    memory_info.0.dedup_by_key(|a| a.pid());
    memory_info.0.sort_by_key(|a| a.is_main());

    tracing::info!("mem usage:\n\n{}", FmtProcessInfo(&memory_info));
    std::thread::sleep(std::time::Duration::from_secs(60 * 5));
  });
}
