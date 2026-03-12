use tauri::*;

mod mem;
mod opentelemetry;
mod tracing;

pub use mem::force_find_processes;
pub use mem::init_mem_watching;
pub use tracing::init_tracing;

pub fn collect_logs<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
	use crate::error::ShowError as _;
	use std::io::BufWriter;
	use tauri_plugin_dialog::DialogExt;

	let logs_dir = app.path().app_data_dir()?.join("logs");
	if !logs_dir.exists() {
		return Ok(());
	}

	let archive_name = format!("logs-{}.tar.xz", chrono::Local::now().format("%Y-%m-%d_%H-%M-%S"));

	let mut data = vec![];
	let mut tar = tar::Builder::new(&mut data);
	tar.append_dir_all("logs", logs_dir)?;
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
