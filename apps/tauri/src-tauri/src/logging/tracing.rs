use std::io::BufWriter;
use std::path::PathBuf;

use tracing::level_filters::LevelFilter;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use tauri::*;

const MAX_FILE_COUNT: usize = 10;

pub fn init_tracing<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
	let filter = tracing_subscriber::EnvFilter::try_from_default_env()
		.unwrap_or(EnvFilter::builder().with_default_directive(LevelFilter::INFO.into()).from_env_lossy());

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
		if entry.file_name().to_str().map_or(false, |name| name.ends_with(".json")) {
			let _ = std::fs::remove_file(entry.path());
		}

		if entry.file_name().to_str().map_or(false, |name| {
			name.starts_with("gx-") && name.ends_with(".ndjson") && name != "gx-latest.ndjson"
		}) {
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
