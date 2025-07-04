use std::path::Path;
use tauri::*;

use crate::error::ShowError;

use crate::shared::handle_external_url;
use crate::shared::should_allow_navigation;
use crate::shared::AppHandleExt;
use crate::shared::ALLOWED_DOMAINS;

pub mod commands;
pub mod download_callback;
pub mod init;
pub mod menu;
pub mod save_windows;
mod win;
mod updater;

#[cfg(target_os = "macos")]
mod custom_protocol;

#[cfg(target_family = "unix")]
pub use menu::MenuBuilder;
pub use updater::UpdaterBuilder;

use save_windows::SaveWindowsExt;

pub fn on_navigation(url: &url::Url) -> bool {
  if should_allow_navigation(url, &ALLOWED_DOMAINS) {
    return true;
  }

  handle_external_url(url)
}

#[cfg(target_os = "macos")]
pub fn on_run_event<R: Runtime>(app: &AppHandle<R>, ev: RunEvent) {
  use crate::shared::MainWindowBuilder;

  match ev {
    RunEvent::Opened { urls } => custom_protocol::on_open_asked(app, urls),
    RunEvent::Reopen { .. } => {
      if let Some((_, window)) =
        app.webview_windows().iter().find(|(label, _)| label.starts_with("gramax-window"))
      {
        _ = window.show().or_show();
        _ = window.unminimize().or_show();
        std::thread::sleep(std::time::Duration::from_millis(300));
        _ = window.set_focus().or_show();
      } else {
        _ = MainWindowBuilder::default().build(app).or_show_with_message(&t!("etc.error.build-window"));
      }
    }
    RunEvent::WindowEvent { event: WindowEvent::CloseRequested { .. }, .. } => {
      _ = app.save_windows().or_show();
    }
    RunEvent::ExitRequested { api, .. } => {
      _ = app.save_windows().or_show();
      api.prevent_exit();
    }
    RunEvent::WindowEvent { label, event, .. } => on_window_event(app, label, event),
    _ => (),
  }
}

#[cfg(not(target_os = "macos"))]
pub fn on_run_event<R: Runtime>(app: &AppHandle<R>, ev: RunEvent) {
  match ev {
    RunEvent::WindowEvent { event: WindowEvent::CloseRequested { .. }, .. } => {
      _ = app.save_windows().or_show()
    }
    RunEvent::Exit => _ = app.save_windows().or_show(),
    RunEvent::WindowEvent { label, event, .. } => on_window_event(app, label, event),
    _ => (),
  }
}

fn on_window_event<R: Runtime>(app: &AppHandle<R>, label: String, event: WindowEvent) {
  if let WindowEvent::Focused(true) = event {
    app.set_focused_webview(label);
  }
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
