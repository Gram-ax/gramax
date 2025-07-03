use tauri::*;

#[cfg(target_os = "android")]
mod android;
#[cfg(target_os = "ios")]
mod ios;

#[cfg(target_os = "android")]
pub use android::*;
#[cfg(target_os = "ios")]
pub use ios::*;

use crate::shared::should_allow_navigation;
use crate::shared::ALLOWED_DOMAINS;

pub mod config {
  use tauri::*;

  pub fn init_env<R: Runtime>(app: &AppHandle<R>) {
    let root_path = app.path().app_data_dir().unwrap_or_default().join("docs");
    std::fs::create_dir_all(&root_path).unwrap();
    std::env::set_var("ROOT_PATH", root_path);
    std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());
  }
}

pub mod commands {
  use tauri::*;

  #[command]
  pub fn set_root_path<R: Runtime>(app: AppHandle<R>) -> std::result::Result<(), String> {
    super::config::init_env(&app);
    Ok(())
  }

  #[command]
  pub fn close_current_window<R: Runtime>(_app: AppHandle<R>) -> std::result::Result<(), String> {
    warn!("close_current_window not implemented");
    Ok(())
  }

  #[command]
  pub fn set_language<R: Runtime>(app: AppHandle<R>, language: &str) -> Result<()> {
    warn!("set_language not implemented");
    Ok(())
  }

  #[command]
  pub fn set_badge<R: Runtime>(_app: AppHandle<R>, _count: Option<usize>) -> Result<()> {
    warn!("set_badge not implemented");
    Ok(())
  }
}

pub fn handle_external_navigation(url: &url::Url) -> bool {
  #[cfg(target_os = "android")]
  return on_android_navigate(url);

  #[cfg(target_os = "ios")]
  return unsafe { on_ios_navigate(url) };

  #[cfg(not(any(target_os = "android", target_os = "ios")))]
  false
}

pub fn on_run_event<R: Runtime>(_: &AppHandle<R>, ev: RunEvent) {}

pub fn on_navigation(url: &url::Url) -> bool {
  info!("Navigating {}", url);
  if should_allow_navigation(url, &ALLOWED_DOMAINS) {
    return true;
  }

  handle_external_navigation(url)
}
