use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::Mutex;

use tauri::*;

use crate::MainWindowBuilder;

use super::save_windows::SaveWindowsExt;

pub static INITED: AtomicBool = AtomicBool::new(false);

pub struct OpenUrl(pub Mutex<Option<String>>);

type InitResult = std::result::Result<(), Box<dyn std::error::Error>>;

pub fn init_app<R: Runtime>(app: &mut App<R>) -> InitResult {
  #[cfg(target_os = "macos")]
  macos_init_spellcheck(&app.config().identifier);

  let manager = app.handle().to_owned();
  app.run_on_main_thread(move || super::migrate_settings::try_migrate_settings(&manager))?;

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

  if opened_path.is_none() {
    app.manage(OpenUrl(Mutex::new(None)));
  }

  if let Some(ref path) = opened_path {
    let path = path.split_once("://").map(|(_, path)| path).unwrap_or(path.as_str());
    let mut url = window.url()?;
    url.set_path(path);
    info!("open url in window: {:?}, url: {}", window.label(), url);
    window.navigate(url)?;
  }

  std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());
  std::env::set_var("USER_DATA_PATH", user_data_path(app));
  std::env::set_var("OS", std::env::consts::OS);

  let documents_dir = &app.path().document_dir().expect("Documents directory not exists");
  std::env::set_var("GRAMAX_DEFAULT_WORKSPACE_PATH", Path::new(documents_dir).join("Gramax/default"));

  INITED.store(true, Ordering::Relaxed);
  Ok(())
}

pub fn user_data_path<R: Runtime, M: Manager<R>>(app: &M) -> std::path::PathBuf {
  app.path().app_config_dir().expect("Config directory doesn't exists")
}

#[cfg(target_os = "macos")]
pub fn macos_init_spellcheck(app_id: &str) {
  let mut cmd = std::process::Command::new("defaults");
  cmd.args(["read", app_id, "WebContinuousSpellCheckingEnabled"]);

  let output = match cmd.output() {
    Ok(output) => output,
    Err(e) => {
      error!("failed to gather output (stdout/stderr) from {:?}; error: {}", cmd, e);
      return;
    }
  };

  let stderr = String::from_utf8_lossy(&output.stderr);

  /*
  Example output if the key does not exist:
  2025-04-23 20:13:56.113 defaults[42911:5909169]
  The domain/default pair of (gramax.dev, WebContinuousSpellCheckingEnabled) does not exist
   */
  if !stderr.contains("does not exist") {
    return;
  }

  info!("auto-enabling spellcheck since it wasn't enabled or disabled by user");
  let mut cmd = std::process::Command::new("defaults");
  cmd.args(["write", app_id, "WebContinuousSpellCheckingEnabled", "-bool", "YES"]);

  info!("running: {:?}", cmd);
  match cmd.spawn().and_then(|mut p| p.wait()) {
    Ok(_) => {}
    Err(e) => error!("failed to run {:?} command; error: {}", cmd, e),
  };
}
