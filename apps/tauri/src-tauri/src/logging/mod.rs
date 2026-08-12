use std::path::{Path, PathBuf};

use tauri::*;

mod mem;
mod opentelemetry;
mod tracing;

pub use mem::force_find_processes;
pub use mem::init_mem_watching;
pub use tracing::init_tracing;
pub use tracing::reload_filter;

const LATEST_FILE: &str = "gx-latest.ndjson";

#[derive(Clone, Copy)]
pub enum LogScope {
	Session,
	Today,
	Last7Days,
	All,
}

impl LogScope {
	fn archive_tag(self) -> &'static str {
		match self {
			LogScope::Session => "session",
			LogScope::Today => "today",
			LogScope::Last7Days => "7d",
			LogScope::All => "all",
		}
	}

	fn window_days(self) -> Option<i64> {
		match self {
			LogScope::Today => Some(1),
			LogScope::Last7Days => Some(7),
			_ => None,
		}
	}
}

fn scoped_files(logs_dir: &Path, scope: LogScope) -> std::io::Result<Vec<PathBuf>> {
	if let LogScope::Session = scope {
		let latest = logs_dir.join(LATEST_FILE);
		return Ok(if latest.exists() { vec![latest] } else { vec![] });
	}

	let prefixes: Option<Vec<String>> = scope.window_days().map(|days| {
		let today = chrono::Local::now().date_naive();
		(0..days)
			.map(|i| format!("gx-{}", (today - chrono::Duration::days(i)).format("%Y-%m-%d")))
			.collect()
	});

	let mut files = Vec::new();
	for entry in std::fs::read_dir(logs_dir)? {
		let entry = entry?;
		let name = entry.file_name();
		let Some(name) = name.to_str() else { continue };

		if name == LATEST_FILE || !name.starts_with("gx-") || !name.ends_with(".ndjson") {
			continue;
		}

		let included = match &prefixes {
			Some(prefixes) => prefixes.iter().any(|p| name.starts_with(p)),
			None => true,
		};

		if included {
			files.push(entry.path());
		}
	}

	files.sort();
	Ok(files)
}

pub fn collect_logs<R: Runtime>(app: &AppHandle<R>, scope: LogScope) -> tauri::Result<()> {
	use crate::error::ShowError as _;
	use std::io::BufWriter;
	use tauri_plugin_dialog::DialogExt;

	let logs_dir = app.path().app_data_dir()?.join("logs");
	if !logs_dir.exists() {
		return Ok(());
	}

	let files = scoped_files(&logs_dir, scope)?;
	if files.is_empty() {
		return Ok(());
	}

	let archive_name = format!("logs-{}-{}.tar.xz", scope.archive_tag(), chrono::Local::now().format("%Y-%m-%d_%H-%M-%S"));

	let mut data = vec![];
	let mut tar = tar::Builder::new(&mut data);
	for file in &files {
		let entry_name = file.file_name().and_then(|n| n.to_str()).unwrap_or("log.ndjson");
		tar.append_path_with_name(file, format!("logs/{entry_name}"))?;
	}
	tar.finish()?;

	let Some(out_path) = app
		.dialog()
		.file()
		.set_file_name(&archive_name)
		.set_can_create_directories(true)
		.blocking_save_file()
	else {
		return Ok(());
	};

	drop(tar);

	let Ok(out_path) = out_path.into_path() else { return Ok(()) };

	let file = std::fs::File::options().create_new(true).write(true).open(out_path)?;
	let mut writer = BufWriter::new(file);
	_ = lzma_rs::xz_compress(&mut std::io::Cursor::new(data), &mut writer).or_show();

	Ok(())
}
