use tauri::*;

pub mod commands;
pub mod http_req;
pub mod http_server;
pub mod navigation;
pub mod session_data;
pub mod window;

pub use navigation::*;
pub use session_data::*;
pub use window::*;

pub trait AppBuilder {
  fn init(self) -> Self;
  fn attach_plugins(self) -> Self;
  fn attach_commands(self) -> Self;
}

pub struct FocusedWebviewLabel(pub std::sync::Mutex<Option<String>>);

pub trait AppHandleExt<R: Runtime> {
  fn get_focused_webview(&self) -> Option<WebviewWindow<R>>;
  fn get_focused_or_default_webview(&self) -> Option<WebviewWindow<R>>;
  fn set_focused_webview(&self, label: String);
}

impl<R: Runtime> AppHandleExt<R> for AppHandle<R> {
  fn get_focused_webview(&self) -> Option<WebviewWindow<R>> {
    let last_focused = self.state::<FocusedWebviewLabel>().inner();

    match self.webview_windows().values().find(|wv| wv.is_focused().unwrap_or_default()) {
      Some(wv) => Some(wv.clone()),
      None => last_focused.0.lock().unwrap().as_deref().and_then(|label| self.get_webview_window(label)),
    }
  }

  fn get_focused_or_default_webview(&self) -> Option<WebviewWindow<R>> {
    self.get_focused_webview().or_else(|| self.webview_windows().values().next().cloned())
  }

  fn set_focused_webview(&self, label: String) {
    self.try_state::<FocusedWebviewLabel>().map(|state| state.inner().0.lock().unwrap().replace(label));
  }
}

pub const ALLOWED_DOMAINS: [&str; 15] = [
  "tauri.localhost",
  "vigo.one",
  "api.vigo.one",
  "gramax",
  "localhost",
  "app.gram.ax",
  "dev.gram.ax",
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "drive.google.com",
  "mega.nz",
  "dropbox.com",
  "rutube.ru",
];
