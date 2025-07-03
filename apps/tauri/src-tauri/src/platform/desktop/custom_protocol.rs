use std::sync::Mutex;

use tauri::*;
use url::Url;

use crate::error::ShowError;
use crate::init::OpenUrl;
use crate::shared::AppHandleExt;
use crate::shared::MainWindowBuilder;

pub fn on_open_asked<R: Runtime>(app: &AppHandle<R>, urls: Vec<Url>) {
  let Some(url) = urls.first().and_then(|url| url.as_str().split_once("://").map(|u| u.1)) else {
    return;
  };

  if let Some(wv) = app.get_focused_or_default_webview() {
    _ = open_url(url, &wv).or_show_with_message(&t!("etc.error.open-url", url = url));
    return;
  }

  if app.try_state::<OpenUrl>().is_none() {
    app.manage(OpenUrl(Mutex::new(Some(url.to_string()))));
    return;
  }

  _ = MainWindowBuilder::default().url(url).build(app).or_show_with_message(&t!("etc.error.build-window"));
}

fn open_url<R: Runtime>(url: &str, window: &WebviewWindow<R>) -> Result<()> {
  let script = crate::include_script!("open-url.template.js", url = url.trim_start_matches('/'));
  info!("open url in window: {:?}, script: {:?}", window, script);
  window.eval(script)?;
  window.show()?;
  window.unminimize()?;
  window.set_focus()?;
  Ok(())
}
