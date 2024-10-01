use std::path::Path;
use tauri::*;

use crate::ALLOWED_DOMAINS;

pub mod commands;
pub mod download_callback;
pub mod init;
pub mod menu;
pub mod save_windows;
mod updater;

#[cfg(target_os = "macos")]
mod custom_protocol;

pub use menu::MenuBuilder;
pub use updater::UpdaterBuilder;

use save_windows::SaveWindowsExt;

#[allow(unused)]
pub fn window_post_init<R: Runtime>(window: &WebviewWindow<R>) -> Result<()> {
  #[cfg(target_os = "windows")]
  window.setup_menu()?;

  Ok(())
}

pub fn on_navigation(url: &url::Url) -> bool {
  if url.scheme() == "blob" || url.domain().is_some_and(|domain| ALLOWED_DOMAINS.contains(&domain)) {
    return true;
  }

  open::that(url.as_str()).unwrap();
  false
}

#[cfg(target_os = "macos")]
pub fn window_event_handler<R: Runtime>(window: &Window<R>, event: &WindowEvent) {
  if !window.label().contains("gramax-window") {
    return;
  };

  if window.app_handle().webview_windows().iter().filter(|w| w.0.contains("gramax-window")).nth(1).is_some() {
    return;
  }

  if let WindowEvent::CloseRequested { api, .. } = event {
    window.app_handle().hide().unwrap();
    api.prevent_close();
  }
}

#[cfg(target_os = "macos")]
pub fn on_run_event<R: Runtime>(app: &AppHandle<R>, ev: RunEvent) {
  match ev {
    RunEvent::Opened { urls } => custom_protocol::on_open_asked(app, urls),
    RunEvent::Exit => _ = app.save_windows(),
    _ => (),
  }
}

#[cfg(not(target_os = "macos"))]
pub fn on_run_event<R: Runtime>(app: &AppHandle<R>, ev: RunEvent) {
  if let RunEvent::Exit = ev {
    _ = app.save_windows();
  }
}

fn open_help_docs() -> Result<()> {
  open::that("https://gram.ax/resources/docs")?;
  Ok(())
}

fn assert_can_write<P: AsRef<Path>>(path: P) -> Result<()> {
  let path = path.as_ref();
  let parent = path.parent();

  let res = (|| {
    std::fs::File::create(path)?;
    if let Some(parent) = &parent {
      let filename = path.file_name().unwrap_or_default();
      if !std::fs::read_dir(parent)?
        .any(|p| p.as_ref().map(|p| p.file_name().as_os_str() == filename).unwrap_or(false))
      {
        return Err(std::io::Error::new(std::io::ErrorKind::NotFound, "File not found"));
      }
    }

    std::fs::remove_file(path)
  })();

  if res.as_ref().is_err() {
    rfd::MessageDialog::new()
      .set_level(rfd::MessageLevel::Error)
      .set_title(t!("file-download.fail"))
      .set_description(t!("file-download.no-permissions", path = &parent.unwrap_or(path).display()))
      .set_buttons(rfd::MessageButtons::Ok)
      .show();
  }

  Ok(res?)
}
