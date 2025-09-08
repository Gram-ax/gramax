use std::path::PathBuf;

use tracing::level_filters::LevelFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::Layer;

const LOG_DIR: &str = "/mnt/logs";
const MAX_FILE_COUNT: usize = 10;

pub fn init() -> Result<(), std::io::Error> {
  let filter = tracing_subscriber::EnvFilter::builder()
    .with_default_directive(LevelFilter::INFO.into())
    .parse("")
    .unwrap();

  tracing_subscriber::registry()
    .with(filter)
    .with(stdout())
    .with(dir_json(LOG_DIR.into(), MAX_FILE_COUNT)?)
    .init();

  Ok(())
}

fn stdout<S>() -> impl Layer<S>
where
  S: tracing::Subscriber,
  for<'a> S: tracing_subscriber::registry::LookupSpan<'a>,
{
  tracing_subscriber::fmt::layer()
    .without_time()
    .with_ansi(false)
    .with_target(false)
    .with_thread_ids(false)
    .with_thread_names(false)
    .with_file(false)
    .with_line_number(false)
    .with_level(true)
    .compact()
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

  let now = unsafe { crate::ffi::emscripten_get_now() as i64 };
  let now = chrono::DateTime::from_timestamp_millis(now).unwrap().format("%Y-%m-%d_%H-%M-%S");
  let log_path = dir.join(format!("gx-log-{now}.json"));

  let file = std::fs::File::options().append(true).create(true).open(&log_path)?;

  Ok(tracing_subscriber::fmt::layer().pretty().json().flatten_event(true).with_writer(file))
}
