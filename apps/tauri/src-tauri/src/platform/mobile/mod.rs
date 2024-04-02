#[cfg(target_os = "android")]
mod android;
#[cfg(target_os = "ios")]
mod ios;

#[cfg(target_os = "android")]
pub use android::*;
#[cfg(target_os = "ios")]
pub use ios::*;

use crate::ALLOWED_DOMAINS;

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
  pub fn set_root_path() -> std::result::Result<(), String> {
    unimplemented!()
  }

  #[command]
  pub fn close_current_window() -> std::result::Result<(), String> {
    unimplemented!()
  }
}

pub fn on_navigation(url: &url::Url) -> bool {
  info!("Navigating {}", url);
  if !url.domain().is_some_and(|domain| ALLOWED_DOMAINS.contains(&domain)) {
    #[cfg(target_os = "android")]
    return on_android_navigate(url);

    #[cfg(target_os = "ios")]
    return unsafe { on_ios_navigate(url) };
  }
  true
}
