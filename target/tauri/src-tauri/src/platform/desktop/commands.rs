use std::path::Path;
use std::{env, fs};

use tauri::*;

use super::child_window::ChildWindow;


#[command]
pub fn close_current_window<R: Runtime>(app: AppHandle<R>, window: Window<R>) -> Result<()> {
  let url = window.url();
  let query = url.query();
  app.emit_to(window.label(), "on_window_close", query)?;
  window.close()?;
  Ok(())
}

#[command]
pub fn set_root_path<R: Runtime>(app: AppHandle<R>, path: &Path) -> tauri::Result<()> {
  env::set_var("ROOT_PATH", path);
  let config_path = super::config::config_path(&app);
  fs::create_dir_all(config_path.parent().unwrap_or_else(|| Path::new("")))?;
  fs::write(config_path, format!("ROOT_PATH={:?}", path))?;
  for (_, window) in app.windows().iter().filter(|window| window.0.contains("main")) {
    window.eval("location.replace('/')")?;
  }

  if let Some(window) = app.get_window("settings") {
    window.close()?;
  }

  Ok(())
}

#[cfg(target_os = "macos")]
#[command]
pub fn show_print<R: Runtime>(window: Window<R>) -> Result<()> {
  window.print()
}

#[command]
pub fn show_settings<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  ChildWindow::Settings.create_exact(&app)?;
  Ok(())
}
