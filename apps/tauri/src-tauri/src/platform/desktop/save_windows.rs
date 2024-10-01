use std::collections::HashMap;

use tauri::*;
use tauri_plugin_window_state::AppHandleExt;
use tauri_plugin_window_state::StateFlags;

use crate::AppHandleExt as _;
use crate::MainWindowBuilder;

#[derive(Default, serde::Serialize, serde::Deserialize)]
struct SavedWindows {
  focused_window_name: Option<String>,
  windows: HashMap<String, String>,
}

const REOPEN_WINDOWS_FILENAME: &str = "gramax-reopen-windows";

pub trait SaveWindowsExt<R: Runtime> {
  fn save_windows(&self) -> Result<()>;
  fn reopen_windows(&self) -> Result<Option<WebviewWindow<R>>>;
}

impl<R: Runtime> SaveWindowsExt<R> for AppHandle<R> {
  fn save_windows(&self) -> Result<()> {
    let windows = self.webview_windows();
    let mut saved_windows = SavedWindows::default();

    for window in windows.values() {
      let Ok(url) = window.url() else { continue };

      if window.is_focused().unwrap_or(false) {
        saved_windows.focused_window_name.replace(window.label().to_string());
      }
      saved_windows.windows.insert(window.label().to_string(), url.path().to_string());
    }

    let bytes = serde_json::to_vec(&saved_windows)?;
    std::fs::write(self.path().app_data_dir()?.join(REOPEN_WINDOWS_FILENAME), bytes)?;
    _ = self.save_window_state(StateFlags::all());
    Ok(())
  }

  fn reopen_windows(&self) -> Result<Option<WebviewWindow<R>>> {
    let path = self.path().app_data_dir()?.join(REOPEN_WINDOWS_FILENAME);
    let window_state_path = self.path().app_data_dir()?.join(self.filename());

    if !path.exists() {
      return Ok(None);
    }

    let content_json = std::fs::read(&path)?;
    std::fs::remove_file(&path)?;

    if window_state_path.exists() {
      std::fs::remove_file(window_state_path)?;
    }

    let Ok(SavedWindows { focused_window_name, windows }) = serde_json::from_slice(content_json.as_slice())
    else {
      return Ok(None);
    };

    for (label, url) in windows {
      MainWindowBuilder::default().label(label).url(url).build(self)?;
    }

    if let Some(label) = focused_window_name {
      self.get_webview_window(&label).map(|w| w.set_focus()).unwrap_or(Ok(()))?;
    }

    Ok(self.get_focused_webview().or_else(|| self.webview_windows().values().next().cloned()))
  }
}
