use tauri::*;

use std::collections::HashMap;

use crate::oauth_server::listen_one;
use crate::platform::commands::*;
use crate::translation::Language;

pub fn generate_handler<R: Runtime>(builder: Builder<R>) -> Builder<R> {
  builder.invoke_handler(generate_handler![
    http_listen_one,
    close_current_window,
    get_user_language,
    set_root_path,
    quit,
    read_env,
    #[cfg(target_os = "macos")]
    show_print,
    #[cfg(desktop)]
    show_settings,
  ])
}

#[tauri::command]
pub fn read_env() -> HashMap<String, String> {
  std::env::vars().collect::<HashMap<String, String>>()
}

#[tauri::command]
pub fn quit(code: i32, message: &str) {
  eprintln!("{}", message);
  std::process::exit(code)
}

#[command]
pub fn get_user_language<R: Runtime>(app: AppHandle<R>) -> String {
  app.state::<Language>().to_string()
}

#[command]
pub fn http_listen_one<R: Runtime>(
  window: Window<R>,
  url: &str,
  redirect: Box<str>,
  callback_name: Box<str>,
) -> Result<()> {
  #[cfg(mobile)]
  window.eval(&format!("window.location.replace('{url}')"))?;

  #[cfg(desktop)]
  open::that(url)?;

  listen_one(redirect, move |req| window.emit(&callback_name, req.url().split('?').nth(1)).unwrap());
  Ok(())
}
