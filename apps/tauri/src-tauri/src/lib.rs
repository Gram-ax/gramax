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

use std::path::PathBuf;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;

use error::ShowError;
use http_server::start_ping_server;

use platform::*;

use tauri::*;

i18n!("locales");

pub const ALLOWED_DOMAINS: [&str; 3] = ["tauri.localhost", "localhost", "gramax"];

trait AppBuilder {
  fn init(self) -> Self;
  fn attach_plugins(self) -> Self;
  fn attach_commands(self) -> Self;
}

trait AppHandleExt<R: Runtime> {
  fn get_focused_webview(&self) -> Option<WebviewWindow<R>>;
}

impl<R: Runtime> AppHandleExt<R> for AppHandle<R> {
  fn get_focused_webview(&self) -> Option<WebviewWindow<R>> {
    self.webview_windows().values().find(|wv| wv.is_focused().unwrap_or_default()).cloned()
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  crate::error::setup_bugsnag_and_panic_hook(option_env!("BUGSNAG_API_KEY").unwrap_or_default().to_string());
  set_locale();

  let builder = Builder::default().init().attach_commands().attach_plugins();
  let context = tauri::generate_context!();

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

  let window = app.get_focused_webview().or_else(|| app.webview_windows().values().next().cloned());

  if let Some(window) = window {
    _ = window.eval(&format!("window.location.replace('/{}')", path.trim_start_matches('/'))).or_show();
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

  pub fn build<R: Runtime, M: Manager<R>>(self, manager: &M) -> Result<WebviewWindow<R>> {
    let label = self.get_unique_label(manager);

    let builder = WebviewWindowBuilder::new(manager, label.clone(), WebviewUrl::App(self.get_url()))
      .auto_resize()
      .zoom_hotkeys_enabled(true)
      .disable_drag_drop_handler()
      .initialization_script(include_str!("init.js"))
      .on_navigation(on_navigation);

    #[cfg(desktop)]
    let builder = {
      let callback = download_callback::DownloadCallback::new();
      builder.on_download(move |w, e| callback.on_download(w, e))
    };

    #[cfg(target_os = "macos")]
    let builder = builder.initialization_script(include_str!("platform/desktop/macos.js"));

    #[cfg(desktop)]
    let builder = builder.title("Gramax").enable_clipboard_access().inner_size(1000.0, 700.0);

    let window = builder.build()?;

    Ok(window)
  }

  fn get_unique_label<R: Runtime, M: Manager<R>>(&self, manager: &M) -> String {
    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    if let Some(label) = self.label.clone() {
      return label;
    }

    let mut label = format!("gramax-window-{}", COUNTER.fetch_add(1, Ordering::SeqCst));
    while manager.webview_windows().contains_key(&label) {
      label = format!("gramax-window-{}", COUNTER.fetch_add(1, Ordering::SeqCst));
    }

    label
  }

  fn get_url(&self) -> PathBuf {
    self.path.clone().unwrap_or_else(|| PathBuf::from("index.html"))
  }
}
