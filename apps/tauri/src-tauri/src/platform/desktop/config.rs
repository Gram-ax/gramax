use std::path::Path;
use std::sync::Mutex;

use tauri::*;

use crate::build_main_window_with_path;

pub struct OpenUrl(pub Mutex<Option<String>>);

#[derive(Default, serde::Serialize, serde::Deserialize)]
struct DumpedWindows {
  focused_url: Option<String>,
  window_urls: Vec<String>,
}

const REOPEN_WINDOWS_FILENAME: &str = "gramax-reopen-windows";

pub fn init_env<R: Runtime>(app: &AppHandle<R>, active_window: &mut WebviewWindow<R>) {
  std::env::remove_var("ROOT_PATH");
  if let Err(err) = dotenvy::from_filename_override(config_path(app)) {
    warn!("Error while loading config: {:?}", err);
  }

  let args_path = std::env::args().nth(1);

  let path = app.try_state::<OpenUrl>().as_deref().and_then(|m| m.0.lock().unwrap().take()).or(args_path);
  if let Some(ref path) = path {
    let path = path.split_once("://").map(|(_, path)| path).unwrap_or(path.as_str());
    _ = active_window.eval(&format!("window.location.replace('/{}')", path.trim_start_matches('/')));
  }

  if let Err(err) = reopen_dumped_windows(active_window) {
    error!("reopen windows error: {err:?}");
  }

  std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());
  std::env::set_var("USER_DATA_PATH", user_data_path(app));
  std::env::set_var("OS", std::env::consts::OS);

  let documents_dir = &app.path().document_dir().expect("Documents directory not exists");
  std::env::set_var("GRAMAX_DEFAULT_WORKSPACE_PATH", Path::new(documents_dir).join("Gramax/default"))
}

pub fn user_data_path<R: Runtime>(app: &AppHandle<R>) -> std::path::PathBuf {
  app.path().app_config_dir().expect("Config directory doesn't exists")
}

pub fn dump_opened_windows<R: Runtime>(app: &AppHandle<R>) -> Result<()> {
  let windows = app.webview_windows();
  let mut dumped_windows = DumpedWindows::default();

  for window in windows.values() {
    let Ok(url) = window.url() else { continue };

    if window.is_focused().unwrap_or(false) {
      dumped_windows.focused_url.replace(url.path().to_string());
    } else {
      dumped_windows.window_urls.push(url.path().to_string())
    }
  }

  let bytes = serde_json::to_vec(&dumped_windows)?;
  std::fs::write(app.path().temp_dir()?.join(REOPEN_WINDOWS_FILENAME), bytes)?;
  Ok(())
}

pub fn reopen_dumped_windows<R: Runtime>(active_window: &mut WebviewWindow<R>) -> Result<()> {
  let path = active_window.app_handle().path().temp_dir()?.join(REOPEN_WINDOWS_FILENAME);

  if !path.exists() {
    return Ok(());
  }

  let content_json = std::fs::read(&path)?;
  std::fs::remove_file(&path)?;

  let Ok(DumpedWindows { focused_url, window_urls }) = serde_json::from_slice(content_json.as_slice()) else {
    return Ok(());
  };

  for path in window_urls {
    if let Err(err) = build_main_window_with_path(active_window.app_handle(), path) {
      error!("unable to open window: {}", err);
    }
  }

  if let Some(focused_url) = focused_url {
    _ = active_window
      .eval(&format!("window.location.replace('/{}')", focused_url.as_str().trim_start_matches('/')));
  }

  _ = active_window.show();
  _ = active_window.set_focus();

  Ok(())
}

#[deprecated]
pub fn config_path<R: Runtime>(app: &AppHandle<R>) -> std::path::PathBuf {
  user_data_path(app).join(".config")
}
