use std::io::BufWriter;
use std::path::PathBuf;
use std::sync::OnceLock;

use tracing::level_filters::LevelFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::reload;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::Registry;

use tauri::*;

const MAX_FILE_COUNT: usize = 10;

static FILTER_RELOAD_HANDLE: OnceLock<reload::Handle<EnvFilter, Registry>> = OnceLock::new();

/// Live-reload the min tracing level without restart (backs the runtime otel level switch from JS).
/// Crate-scoped `RUST_LOG` directives (`crate=level`) are preserved; only the global level is replaced.
pub fn reload_filter(directive: &str) -> std::result::Result<(), String> {
	let handle = FILTER_RELOAD_HANDLE.get().ok_or_else(|| "tracing is not initialized".to_string())?;

	let scoped = std::env::var("RUST_LOG")
		.unwrap_or_default()
		.split(',')
		.filter(|d| d.contains('='))
		.collect::<Vec<_>>()
		.join(",");
	let directives =
		if scoped.is_empty() { directive.to_string() } else { format!("{directive},{scoped}") };

	let filter = EnvFilter::builder().parse(directives).map_err(|err| err.to_string())?;
	handle.reload(filter).map_err(|err| err.to_string())
}

pub fn init_tracing<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
	let filter = tracing_subscriber::EnvFilter::try_from_default_env()
		.unwrap_or(EnvFilter::builder().with_default_directive(LevelFilter::INFO.into()).from_env_lossy());

	let (filter, reload_handle) = reload::Layer::new(filter);
	let _ = FILTER_RELOAD_HANDLE.set(reload_handle);

	let logs_dir = app.path().app_data_dir()?.join("logs");
	let log_file = create_log_file(&logs_dir)?;
	let log_sender = crate::logging::opentelemetry::spawn_log_writer(log_file);

	crate::logging::opentelemetry::register_js_listener(app, log_sender.clone());

	tracing_subscriber::registry()
		.with(filter)
		.with(crate::logging::opentelemetry::open_telemetry(app.clone(), log_sender))
		.init();

	Ok(())
}

fn create_log_file(dir: &PathBuf) -> std::io::Result<BufWriter<std::fs::File>> {
	std::fs::create_dir_all(dir)?;

	let latest_path = dir.join("gx-latest.ndjson");
	_ = std::fs::remove_file(&latest_path);

	let mut files = Vec::new();

	for entry in std::fs::read_dir(dir)? {
		let entry = entry?;
		if entry.file_name().to_str().is_some_and(|name| name.ends_with(".json")) {
			let _ = std::fs::remove_file(entry.path());
		}

		if entry
			.file_name()
			.to_str()
			.is_some_and(|name| name.starts_with("gx-") && name.ends_with(".ndjson") && name != "gx-latest.ndjson")
		{
			files.push(entry);
		}
	}

	files.sort_by_key(|f| f.file_name());

	if files.len() >= MAX_FILE_COUNT {
		for file in &files[..files.len() - MAX_FILE_COUNT + 1] {
			let _ = std::fs::remove_file(file.path());
		}
	}

	let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
	let log_path = dir.join(format!("gx-{now}.ndjson"));

	let file = std::fs::File::options().append(true).create(true).open(&log_path)?;

	let _ = std::fs::hard_link(&log_path, &latest_path);

	Ok(BufWriter::new(file))
}
