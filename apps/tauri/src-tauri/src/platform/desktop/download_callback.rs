use std::cell::Cell;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;

use tauri::*;

use webview::DownloadEvent;

use super::assert_can_write;

type MutablePathBuf = Arc<Mutex<Cell<Option<PathBuf>>>>;

pub struct DownloadCallback {
	last_download_destination: MutablePathBuf,
}

impl DownloadCallback {
	pub fn new() -> Self {
		let last_download_destination = Arc::new(Mutex::new(Cell::new(None::<PathBuf>)));
		Self { last_download_destination }
	}

	pub fn on_download<R: Runtime>(&self, _: Webview<R>, event: DownloadEvent) -> bool {
		match event {
			DownloadEvent::Requested { url: _, destination } => self.on_download_requested(destination),
			DownloadEvent::Finished { success, .. } => self.on_download_finished(success),
			_ => false,
		}
	}

	fn on_download_requested(&self, destination: &mut PathBuf) -> bool {
		let filename = destination.file_name().and_then(|s| s.to_str()).unwrap_or("exported_file");
		let Some(selected_path) = rfd::FileDialog::new().set_file_name(filename).save_file() else {
			return false;
		};

		if assert_can_write(&selected_path).is_err() {
			return false;
		}

		destination.clone_from(&selected_path);
		self.last_download_destination.lock().unwrap().set(Some(selected_path));
		true
	}

	fn on_download_finished(&self, success: bool) -> bool {
		if success {
			return true;
		}

		let Some(last_download_destination) = self.last_download_destination.lock().unwrap().take() else {
			return false;
		};

		let Some(filename) = last_download_destination.file_name().and_then(|s| s.to_str()) else {
			return false;
		};

		rfd::MessageDialog::new()
			.set_title(t!("file-download.fail-title"))
			.set_description(t!("file-download.fail-desc", name = filename))
			.set_level(rfd::MessageLevel::Error)
			.show();
		true
	}
}
