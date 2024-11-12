use std::path::PathBuf;

use crate::platform::desktop::menu::MenuBuilder;
use tauri::*;

#[command]
pub fn close_current_window<R: Runtime>(app: AppHandle<R>, window: WebviewWindow<R>) -> Result<()> {
  let url = window.url()?;
  let query = url.query();
  app.emit_to(window.label(), "on_window_close", query)?;
  window.close()?;
  Ok(())
}

#[command(async)]
pub fn open_directory() -> Option<PathBuf> {
  rfd::FileDialog::new().pick_folder()
}

#[cfg(target_os = "macos")]
#[command]
pub fn show_print<R: Runtime>(window: WebviewWindow<R>) -> Result<()> {
  window.print()
}

#[command]
pub fn set_language<R: Runtime>(app: AppHandle<R>, language: &str) -> Result<()> {
  if !["ru", "en"].contains(&language) {
    let err = anyhow::anyhow!("invalid language provided; available `ru`, `en` but got: `{}`", language);
    return Err(err.into());
  }

  rust_i18n::set_locale(language);

  #[cfg(not(target_os = "windows"))]
  app.setup_menu()?;

  #[cfg(target_os = "windows")]
  {
    for (_, wv) in app.webview_windows().iter() {
      wv.setup_menu()?;
    }
  }

  app.emit("on_language_changed", language)?;

  Ok(())
}
