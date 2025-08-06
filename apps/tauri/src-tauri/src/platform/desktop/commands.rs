use std::path::Path;
use std::path::PathBuf;

use crate::error::ShowError;
use crate::platform::desktop::menu::MenuBuilder;
use crate::shared::MainWindowBuilder;
use tauri::*;

#[command]
pub fn close_current_window<R: Runtime>(app: AppHandle<R>, window: WebviewWindow<R>) -> Result<()> {
  let url = window.url()?;
  let query = url.query();
  app.emit_to(window.label(), "on_window_close", query)?;
  window.close()?;
  Ok(())
}

#[command]
pub fn new_window<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  std::thread::spawn(move || {
    MainWindowBuilder::default().build(&app).or_show_with_message(&t!("etc.error.build-window"))
  });

  Ok(())
}

#[command]
pub fn minimize_window<R: Runtime>(window: WebviewWindow<R>) -> Result<()> {
  window.minimize()?;
  Ok(())
}

#[command(async)]
pub fn open_directory() -> Option<PathBuf> {
  rfd::FileDialog::new().pick_folder()
}

#[command]
pub fn open_in_explorer(path: &Path) -> Result<()> {
  _ = path.metadata()?;
  _ = open::that_detached(path).or_show_with_message(&t!("etc.error.open-path", path = path.to_string_lossy()));
  Ok(())
}

#[cfg(target_os = "macos")]
#[command]
pub fn show_print<R: Runtime>(window: WebviewWindow<R>) -> Result<()> {
  window.print()
}

#[command]
pub fn set_language<R: Runtime>(app: AppHandle<R>, language: &str) -> Result<()> {
  if !["ru", "en"].contains(&language) {
    let err = anyhow::anyhow!("invalid language provided; available `ru`, `en` but got: `{}`", language);
    return Err(err.into());
  }

  rust_i18n::set_locale(language);

  #[cfg(not(target_os = "windows"))]
  app.setup_menu()?;

  #[cfg(target_os = "windows")]
  {
    for (_, wv) in app.webview_windows().iter() {
      wv.setup_menu()?;
    }
  }

  app.emit("on_language_changed", language)?;

  Ok(())
}

#[command(async)]
pub fn open_window_with_url<R: Runtime>(app: AppHandle<R>, url: Url) -> Result<()> {
  MainWindowBuilder::default().url(url.path()).build(&app)?;
  Ok(())
}

#[cfg(any(target_os = "macos", target_os = "linux"))]
#[command]
pub fn set_badge<R: Runtime>(window: WebviewWindow<R>, count: Option<i64>) -> Result<()> {
  window.set_badge_count(count)?;
  Ok(())
}

#[cfg(target_os = "windows")]
#[command]
pub fn set_badge<R: Runtime>(window: WebviewWindow<R>, count: Option<usize>) -> Result<()> {
  super::init::Badges::set_badge(&window, count)?;
  Ok(())
}

#[command]
pub fn move_to_trash<R: Runtime>(window: Window<R>, path: &Path) -> std::result::Result<(), String> {
  use std::sync::OnceLock;
  use tauri_plugin_dialog::DialogExt;
  use tauri_plugin_dialog::MessageDialogButtons;

  static DIALOG_DID_SHOWED: OnceLock<()> = OnceLock::new();

  #[cfg(target_os = "macos")]
  let trash_result = {
    use trash::macos::TrashContextExtMacos;
    let mut trash_ctx = trash::TrashContext::default();
    trash_ctx.set_delete_method(trash::macos::DeleteMethod::NsFileManager);
    trash_ctx.delete(path)
  };

  #[cfg(not(target_os = "macos"))]
  let trash_result = trash::delete(path);

  let Err(err) = trash_result else { return Ok(()) };

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
    .buttons(MessageDialogButtons::Ok)
    .show(|_| {});

  Err(err.to_string())
}
