use std::path::PathBuf;

use tauri::*;

pub fn init_env<R: Runtime>(app: &AppHandle<R>) {
  if let Err(err) = dotenvy::from_filename_override(config_path(app)) {
    warn!("Error while loading config: {:?}", err);
  }

  std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());
  std::env::set_var("USER_DATA_PATH", user_data_path(app));

  if std::env::var("ROOT_PATH").is_err() {
    let root = root_path(app);
    std::env::set_var("ROOT_PATH", root.display().to_string());
    std::fs::create_dir_all(root).expect("Can't create docs dir");
  }
}

pub fn root_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
  std::env::var("ROOT_PATH")
    .map(PathBuf::from)
    .unwrap_or(app.path().document_dir().expect("Document directory not exists"))
    .join("docs")
}

pub fn user_data_path<R: Runtime>(app: &AppHandle<R>) -> std::path::PathBuf {
  app.path().app_config_dir().expect("Config directory doesn't exists")
}

pub fn config_path<R: Runtime>(app: &AppHandle<R>) -> std::path::PathBuf {
  user_data_path(app).join(".config")
}
