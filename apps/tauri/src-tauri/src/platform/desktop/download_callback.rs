#![cfg(any(target_os = "macos", target_os = "linux"))]
use std::cell::Cell;
use std::path::PathBuf;
use std::sync::Arc;
use std::sync::Mutex;

use tauri::window::DownloadEvent;
use tauri::*;

use notify_rust::Notification;
use notify_rust::Timeout;

pub struct DownloadCallback {
  last_download_destination: Arc<Mutex<Cell<Option<PathBuf>>>>,
}

impl DownloadCallback {
  pub fn new() -> Self {
    let last_download_destination = Arc::new(Mutex::new(Cell::new(None::<PathBuf>)));
    Self { last_download_destination }
  }

  pub fn on_download<R: Runtime>(&self, window: Window<R>, event: DownloadEvent) -> bool {
    match event {
      DownloadEvent::Requested { url: _, destination } => {
        let filename = destination.file_stem().and_then(|s| s.to_str()).unwrap_or("exported_file");
        let ext =
          destination.extension().and_then(|s| s.to_str()).map(|s| format!(".{}", s)).unwrap_or_default();
        let Ok(downloads_path) = window.path().download_dir() else {
          error!("No downloads directory found");
          return false;
        };

        let mut file_path = downloads_path.join(format!("{}{}", filename, ext));
        let mut i = 1;
        while file_path.exists() {
          file_path.set_file_name(format!("{}_{}{}", filename, i, ext));
          i += 1;
        }
        *destination = file_path.clone();
        self.last_download_destination.lock().unwrap().set(Some(file_path));
        true
      }
      DownloadEvent::Finished { success, .. } => self.on_download_finished(success),
      _ => false,
    }
  }

  fn on_download_finished(&self, success: bool) -> bool {
    let Some(last_download_destination) = self.last_download_destination.lock().unwrap().take() else {
      return false;
    };

    let Some(filename) = last_download_destination.file_name().and_then(|s| s.to_str()) else {
      return false;
    };

    let body = if success { t!("file-download.body-ok") } else { t!("file-download.body-err") };
    let body = &format!("{}: {}", body, filename);
    if let Err(err) = self.show_notification(body) {
      error!("{}", err)
    }
    true
  }

  fn show_notification(&self, body: &str) -> std::result::Result<(), notify_rust::error::Error> {
    Notification::new()
      .summary(&t!("file-download.title"))
      .body(body)
      .auto_icon()
      .timeout(Timeout::Milliseconds(5000))
      .show()
      .map(|_| ())
  }
}
