use std::path::Path;
use std::path::PathBuf;

use crate::error::ShowError;
use crate::platform::desktop::menu::MenuBuilder;
use crate::MainWindowBuilder;
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
pub fn new_window<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  std::thread::spawn(move || {
    MainWindowBuilder::default().build(&app).or_show_with_message(&t!("etc.error.build-window"))
  });

  Ok(())
}

#[command]
pub fn minimize_window<R: Runtime>(window: WebviewWindow<R>) -> Result<()> {
  window.minimize()?;
  Ok(())
}

#[command(async)]
pub fn open_directory() -> Option<PathBuf> {
  rfd::FileDialog::new().pick_folder()
}

#[command]
pub fn open_in_explorer(path: &Path) -> Result<()> {
  _ = path.metadata()?;
  _ = open::that(path).or_show_with_message(&t!("etc.error.open-path", path = path.to_string_lossy()));
  Ok(())
}

#[command]
pub fn set_session_data<R: Runtime>(window: WebviewWindow<R>, key: &str, data: &str) -> Result<()> {
  use super::save_windows::WindowSessionDataExt;

  window.set_session_data(key, data);
  Ok(())
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

#[command(async)]
pub fn open_window_with_url<R: Runtime>(app: AppHandle<R>, url: Url) -> Result<()> {
  MainWindowBuilder::default().url(url.path()).build(&app)?;
  Ok(())
}
