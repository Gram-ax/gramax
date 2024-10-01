use std::path::PathBuf;

use tauri::*;

#[command]
pub fn close_current_window<R: Runtime>(app: AppHandle<R>, window: WebviewWindow<R>) -> Result<()> {
  let url = window.url()?;
  let query = url.query();
  app.emit_to(window.label(), "on_window_close", query)?;
  window.close()?;
  Ok(())
}

#[command]
pub fn open_directory() -> Option<PathBuf> {
  rfd::FileDialog::new().pick_folder()
}

#[cfg(target_os = "macos")]
#[command]
pub fn show_print<R: Runtime>(window: WebviewWindow<R>) -> Result<()> {
  window.print()
}
