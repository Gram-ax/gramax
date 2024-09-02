use std::sync::Mutex;

use tauri::*;
use url::Url;

use crate::config::OpenUrl;
use crate::AppHandleExt;

pub fn on_open_asked<R: Runtime>(app: &AppHandle<R>, urls: Vec<Url>) {
  let Some(url) = urls.first().and_then(|url| url.as_str().split_once("://").map(|u| u.1)) else {
    return;
  };

  let Some(window) = app.get_focused_webview().or_else(|| app.webview_windows().values().next().cloned())
  else {
    if let Some(state) = app.try_state::<OpenUrl>().as_deref() {
      state.0.lock().unwrap().replace(url.to_string());
    } else {
      app.manage(OpenUrl(Mutex::new(Some(url.to_string()))));
    }
    return;
  };

  let webviews = app.webview_windows();
  let Some(webview) = webviews.values().next() else { return };

  let Err(err) = webview.eval(&format!("window.location.replace('/{}')", url.trim_start_matches('/'))) else {
    info!("open url: {}", url);
    if let Err(err) = window.set_focus() {
      warn!("couldn't set focus; {err:?}");
    }
    return;
  };
  error!("couldn't open url ${url} in new window, error: ${err:?}")
}
