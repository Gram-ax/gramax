use std::path::Path;
use std::sync::Mutex;

use tauri::*;

use crate::MainWindowBuilder;

use super::save_windows::SaveWindowsExt;

pub struct OpenUrl(pub Mutex<Option<String>>);

type InitResult = std::result::Result<(), Box<dyn std::error::Error>>;

pub fn init_app<R: Runtime>(app: &mut App<R>) -> InitResult {
  app.on_menu_event(super::menu::on_menu_event);

  std::env::remove_var("ROOT_PATH");

  let window = match app.handle().reopen_windows()? {
    Some(window) => window,
    None => MainWindowBuilder::default().build(app)?,
  };

  let opened_path = app
    .try_state::<OpenUrl>()
    .as_deref()
    .and_then(|m| m.0.lock().unwrap().take())
    .or(std::env::args().nth(1));
  if let Some(ref path) = opened_path {
    let path = path.split_once("://").map(|(_, path)| path).unwrap_or(path.as_str());
    window.eval(&format!("window.location.replace('/{}')", path.trim_start_matches('/')))?;
  }

  std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());
  std::env::set_var("USER_DATA_PATH", user_data_path(app));
  std::env::set_var("OS", std::env::consts::OS);

  let documents_dir = &app.path().document_dir().expect("Documents directory not exists");
  std::env::set_var("GRAMAX_DEFAULT_WORKSPACE_PATH", Path::new(documents_dir).join("Gramax/default"));

  Ok(())
}

pub fn user_data_path<R: Runtime, M: Manager<R>>(app: &M) -> std::path::PathBuf {
  app.path().app_config_dir().expect("Config directory doesn't exists")
}
