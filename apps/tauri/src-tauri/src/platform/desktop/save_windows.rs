use std::collections::HashMap;
use std::sync::Mutex;

use tauri::*;
use tauri_plugin_window_state::AppHandleExt;
use tauri_plugin_window_state::StateFlags;

use crate::AppHandleExt as _;
use crate::MainWindowBuilder;

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(untagged)]
enum SavedWindow {
  Legacy(String),
  WithSessionData { url: String, session_data: Option<HashMap<String, String>> },
}

#[derive(Default, serde::Serialize, serde::Deserialize)]
struct SavedWindows {
  focused_window_name: Option<String>,
  windows: HashMap<String, SavedWindow>,
}

#[derive(Default, Debug)]
struct WindowSessionData(Mutex<HashMap<String, HashMap<String, String>>>);

const REOPEN_WINDOWS_FILENAME: &str = "gramax-reopen-windows";

pub trait SaveWindowsExt<R: Runtime> {
  fn save_windows(&self) -> Result<()>;
  fn reopen_windows(&self) -> Result<Option<WebviewWindow<R>>>;
}

pub trait WindowSessionDataExt {
  fn set_session_data(&self, key: &str, data: &str);
  fn get_session_data(&self) -> Option<HashMap<String, String>>;
}

impl<R: Runtime> SaveWindowsExt<R> for AppHandle<R> {
  fn save_windows(&self) -> Result<()> {
    let windows = self.webview_windows();
    let mut saved_windows = SavedWindows::default();
    let mut session_data = self.try_state::<WindowSessionData>().map(|s| s.0.lock().unwrap().clone());

    for window in windows.values() {
      let Ok(url) = window.url() else { continue };

      if window.is_focused().unwrap_or(false) {
        saved_windows.focused_window_name.replace(window.label().to_string());
      }

      let saved_window = SavedWindow::WithSessionData {
        url: url.path().to_string(),
        session_data: session_data.as_mut().and_then(|s| s.remove(window.label())),
      };

      saved_windows.windows.insert(window.label().to_string(), saved_window);
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

    let Ok(SavedWindows { focused_window_name, windows, .. }) =
      serde_json::from_slice(content_json.as_slice())
    else {
      return Ok(None);
    };

    for (label, saved_window) in windows {
      if let SavedWindow::WithSessionData { url, session_data } = saved_window {
        MainWindowBuilder::default().label(label).url(url).session_data(session_data).build(self)?;
      }
    }

    if let Some(label) = focused_window_name {
      self.get_webview_window(&label).map(|w| w.set_focus()).unwrap_or(Ok(()))?;
    }

    Ok(self.get_focused_or_default_webview())
  }
}

impl<R: Runtime> WindowSessionDataExt for WebviewWindow<R> {
  fn set_session_data(&self, key: &str, data: &str) {
    let session_data = self
      .try_state::<WindowSessionData>()
      .unwrap_or_else(|| {
        self.manage(WindowSessionData::default());
        self.state()
      })
      .inner();

    let mut session_data = session_data.0.lock().unwrap();
    let session_data = session_data.entry(self.label().to_string()).or_default();

    session_data.insert(key.to_string(), data.to_string());
  }

  fn get_session_data(&self) -> Option<HashMap<String, String>> {
    self.try_state::<WindowSessionData>().and_then(|s| s.0.lock().unwrap().get(self.label()).cloned())
  }
}
