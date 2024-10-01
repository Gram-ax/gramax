use rust_i18n::locale;
use std::path::Path;
use std::sync::OnceLock;
use tauri::*;
use tauri_plugin_dialog::DialogExt;

use std::collections::HashMap;

use crate::http_req;
use crate::http_server::oauth_listen_once;
use crate::platform::commands::*;

pub fn generate_handler<R: Runtime>(builder: Builder<R>) -> Builder<R> {
  builder.invoke_handler(generate_handler![
    http_listen_once,
    close_current_window,
    get_user_language,
    open_directory,
    quit,
    read_env,
    move_to_trash,
    http_req::http_request,
    #[cfg(target_os = "macos")]
    show_print
  ])
}

#[tauri::command]
pub(crate) fn move_to_trash<R: Runtime>(window: Window<R>, path: &Path) -> std::result::Result<(), String> {
  static DIALOG_DID_SHOWED: OnceLock<()> = OnceLock::new();

  let Err(err) = trash::delete(path) else { return Ok(()) };
  if DIALOG_DID_SHOWED.get().is_some() {
    return Err(err.to_string());
  }

  _ = DIALOG_DID_SHOWED.set(());

  let message = match &err {
    trash::Error::CouldNotAccess { target: _ } => t!("trash.no-permissions", path = path.display()),
    err => t!("trash.fail", path = path.display(), err = err.to_string()),
  };

  window
    .dialog()
    .message(message)
    .title(t!("trash.title"))
    .kind(tauri_plugin_dialog::MessageDialogKind::Error)
    .parent(&window)
    .ok_button_label(t!("etc.ok"))
    .show(|_| {});

  Err(err.to_string())
}

#[tauri::command]
pub fn read_env() -> HashMap<String, String> {
  std::env::vars().collect::<HashMap<String, String>>()
}

#[tauri::command]
pub fn quit(code: i32) {
  std::process::exit(code)
}

#[command]
pub fn get_user_language() -> String {
  locale().to_string()
}

#[command]
pub fn http_listen_once<R: Runtime>(
  window: Window<R>,
  url: &str,
  redirect: Box<str>,
  callback_name: Box<str>,
) -> Result<()> {
  #[cfg(mobile)]
  window.eval(&format!("window.location.replace('{url}')"))?;

  #[cfg(desktop)]
  open::that(url)?;

  oauth_listen_once(redirect, move |req| window.emit(&callback_name, req.url().split('?').nth(1)).unwrap());
  Ok(())
}
