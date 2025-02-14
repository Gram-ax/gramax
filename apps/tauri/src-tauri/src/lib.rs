#![cfg(not(target_family = "wasm"))]

#[macro_use]
extern crate log;

#[cfg(test)]
#[macro_use]
extern crate rstest;

#[macro_use]
extern crate rust_i18n;

mod commands;
mod error;
mod http_req;
mod http_server;
mod platform;

use std::collections::HashMap;
use std::path::PathBuf;

use error::ShowError;
use http_server::start_ping_server;

use platform::*;

#[cfg(desktop)]
use platform::save_windows::WindowSessionDataExt;

use tauri::*;

#[macro_export]
macro_rules! include_script {
  ($path: literal) => {
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/scripts/", $path))
  };
  ($path: literal$(, $($args:tt)+)?) => {
    format!($crate::include_script!($path)$(, $($args)+)?)
  };
}

i18n!("locales");

pub const ALLOWED_DOMAINS: [&str; 3] = ["tauri.localhost", "localhost", "gramax"];

trait AppBuilder {
  fn init(self) -> Self;
  fn attach_plugins(self) -> Self;
  fn attach_commands(self) -> Self;
}

pub struct FocusedWebviewLabel(pub std::sync::Mutex<Option<String>>);

trait AppHandleExt<R: Runtime> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  crate::error::setup_bugsnag_and_panic_hook(option_env!("BUGSNAG_API_KEY").unwrap_or_default().to_string());
  set_locale();

  let builder = Builder::default().init().attach_commands().attach_plugins();
  let context = tauri::tauri_build_context!();

  let app = builder.build(context).expect("Can't build app");

  #[cfg(any(target_os = "linux", target_os = "windows"))]
  {
    use tauri_plugin_deep_link::DeepLinkExt;
    if !app.deep_link().is_registered("gramax").unwrap_or(false) {
      _ = app.deep_link().register("gramax").or_show();
    }
  };

  let ping_server_app_handle = app.handle().clone();
  start_ping_server(move |req| handle_ping_server(req, &ping_server_app_handle));

  #[cfg(desktop)]
  {
    #[cfg(target_family = "unix")]
    app.handle().setup_menu().expect("unable to setup menu");
    app.setup_updater().expect("unable to setup updater");
  }

  app.manage(crate::FocusedWebviewLabel(std::sync::Mutex::new(None)));
  
  app.run(platform::on_run_event);
}

impl<R: Runtime> AppBuilder for Builder<R> {
  fn init(self) -> Self {
    self.setup(init::init_app)
  }

  #[allow(clippy::let_and_return)]
  fn attach_plugins(self) -> Self {
    let app = self
      .plugin(plugin_gramax_fs::init())
      .plugin(plugin_gramax_git::init())
      .plugin(tauri_plugin_dialog::init())
      .plugin(tauri_plugin_deep_link::init())
      .plugin(tauri_plugin_window_state::Builder::new().with_filename("gramax-windows-state").build());

    #[cfg(desktop)]
    let app = app
      .plugin(plugin_gramax_fs::init())
      .plugin(tauri_plugin_shell::init())
      .plugin(tauri_plugin_updater::Builder::new().build());

    #[cfg(not(target_os = "android"))]
    let app = {
      use log::LevelFilter;
      use tauri_plugin_log::*;
      app.plugin(
        Builder::default()
          .max_file_size(1024 * 1024 * 10)
          .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Webview),
            Target::new(TargetKind::LogDir { file_name: Some("gramax".into()) }),
          ])
          .level(LevelFilter::Info)
          .format(|f, _, record| {
            f.finish(format_args!(
              "{level:<6} {target} {sep} {body}",
              level = record.level(),
              target = record.target(),
              sep = "#",
              body = record.args()
            ));
          })
          .build(),
      )
    };

    app
  }

  fn attach_commands(self) -> Self {
    commands::generate_handler(self)
  }
}

fn set_locale() {
  let locale = &sys_locale::get_locale().unwrap_or("en".to_string());
  let locale = locale.split_once("-").map(|l| l.0).unwrap_or(locale);
  if ["ru", "en"].contains(&locale) {
    rust_i18n::set_locale(locale);
  } else {
    warn!("unsupported locale: {} ({:?}); using default 'en'", locale, sys_locale::get_locale());
    rust_i18n::set_locale("en");
  }
}

fn handle_ping_server<R: Runtime>(req: &tiny_http::Request, app: &AppHandle<R>) {
  let path = req.url();
  if path.is_empty() || path == "/" {
    return;
  };

  let window = app.get_focused_or_default_webview();

  if let Some(window) = window {
    _ = window.eval(&include_script!("open-url.template.js", url = path.trim_start_matches('/'))).or_show();
    _ = window.request_user_attention(Some(UserAttentionType::Informational));
    _ = window.show().or_show();
    _ = window.unminimize().or_show();
    #[cfg(target_os = "macos")]
    std::thread::sleep(std::time::Duration::from_millis(300));
    _ = window.set_focus().or_show();
  } else {
    let window = MainWindowBuilder::default()
      .url(path)
      .build(app)
      .or_show_with_message(t!("etc.error.build-window").as_ref())
      .unwrap();

    _ = window.set_focus().or_show();
  }
}

#[derive(Default)]
pub struct MainWindowBuilder {
  label: Option<String>,
  path: Option<PathBuf>,
  session_data: Option<HashMap<String, String>>,
}

impl MainWindowBuilder {
  pub fn label(mut self, label: String) -> Self {
    self.label = Some(label);
    self
  }

  pub fn url<S: Into<PathBuf>>(mut self, path: S) -> Self {
    self.path = Some(path.into());
    self
  }

  pub fn session_data(mut self, data: Option<HashMap<String, String>>) -> Self {
    self.session_data = data;
    self
  }

  pub fn build<R: Runtime, M: Manager<R>>(self, manager: &M) -> Result<WebviewWindow<R>> {
    let label = self.get_unique_label(manager);

    let builder = WebviewWindowBuilder::new(manager, label.clone(), WebviewUrl::App(self.get_url()))
      .auto_resize()
      .zoom_hotkeys_enabled(true)
      .disable_drag_drop_handler()
      .initialization_script(include_script!("add-window-close.js"))
      .on_navigation(on_navigation);

    #[cfg(desktop)]
    let builder = {
      let callback = download_callback::DownloadCallback::new();
      builder.on_download(move |w, e| callback.on_download(w, e))
    };

    #[cfg(target_os = "macos")]
    let builder = builder
      .initialization_script(include_script!("macos-fixes.js"))
      .hidden_title(true)
      .title_bar_style(TitleBarStyle::Overlay);

    #[cfg(desktop)]
    let builder =
      builder.title("Gramax").enable_clipboard_access().inner_size(1000.0, 700.0).accept_first_mouse(true);

    let window = builder.build()?;

    #[cfg(desktop)]
    if let Some(session_data) = self.session_data.or(window.get_session_data()) {
      window.eval(&crate::include_script!("restore-session.js", data = session_data))?;
    }

    Ok(window)
  }

  fn get_unique_label<R: Runtime, M: Manager<R>>(&self, manager: &M) -> String {
    if let Some(label) = self.label.clone() {
      return label;
    }

    let mut counter = 0;

    let mut label = format!("gramax-window-{}", counter);
    while manager.webview_windows().contains_key(&label) {
      counter += 1;
      label = format!("gramax-window-{}", counter);
    }

    label
  }

  fn get_url(&self) -> PathBuf {
    self.path.clone().unwrap_or_else(|| PathBuf::from("index.html"))
  }
}
