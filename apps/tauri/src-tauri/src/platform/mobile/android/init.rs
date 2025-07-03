use tauri::*;

use crate::shared::MainWindowBuilder;

type InitResult = std::result::Result<(), Box<dyn std::error::Error>>;

pub fn init_app<R: Runtime>(app: &mut App<R>) -> InitResult {
  crate::platform::mobile::config::init_env(app.handle());
  MainWindowBuilder::default().build(app)?;

  let documents_dir = &app.path().app_local_data_dir().expect("Documents directory not exists");
  std::env::set_var("GRAMAX_DEFAULT_WORKSPACE_PATH", documents_dir.join("Gramax/default"));
  std::env::set_var("USER_DATA_PATH", documents_dir);
  std::env::set_var("IS_MOBILE", "true");

  Ok(())
}

pub fn window_post_init<R: Runtime>(_: &WebviewWindow<R>) -> Result<()> {
  Ok(())
}
