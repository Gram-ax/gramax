#[macro_use]
extern crate log;

#[cfg(test)]
#[macro_use]
extern crate rstest;

#[macro_use]
extern crate rust_i18n;

mod commands;
mod error;
mod http_server;
mod platform;

use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;

use http_server::start_ping_server;
use platform::config::init_env;

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
  crate::error::setup_bugsnag_and_panic_hook(
    option_env!("BUGSNAG_API_KEY").unwrap_or_default().to_string(),
  );
  set_locale();
  start_ping_server();

  let builder = Builder::default().init().attach_commands().attach_plugins();
  let context = tauri::generate_context!();

  #[cfg(target_os = "macos")]
  let builder = builder.on_window_event(platform::window_event_handler);

  let app = builder.build(context).expect("Can't build app");

  #[cfg(desktop)]
  {
    #[cfg(target_family = "unix")]
    app.setup_menu().expect("unable to setup menu");
    app.setup_updater().expect("unable to setup updater");
  }

  app.run(platform::on_run_event);
}

impl<R: Runtime> AppBuilder for Builder<R> {
  fn init(self) -> Self {
    self.setup(|app| {
      let mut window = build_main_window(app.handle())?;
      init_env(app.handle(), &mut window);
      Ok(())
    })
  }

  #[allow(clippy::let_and_return)]
  fn attach_plugins(self) -> Self {
    let app = self
      .plugin(plugin_gramax_fs::init())
      .plugin(plugin_gramax_git::init())
      .plugin(tauri_plugin_dialog::init())
      .plugin(tauri_plugin_deep_link::init());

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
  rust_i18n::set_locale(locale.split_once("-").map(|l| l.0).unwrap_or(locale));
}

pub fn build_main_window<R: Runtime>(app: &AppHandle<R>) -> Result<WebviewWindow<R>> {
  build_main_window_with_path(app, "index.html")
}

pub fn build_main_window_with_path<R: Runtime, P: AsRef<str>>(
  app: &AppHandle<R>,
  path: P,
) -> Result<WebviewWindow<R>> {
  static NEXT_ID: AtomicUsize = AtomicUsize::new(0);

  let builder = WebviewWindowBuilder::new(
    app,
    format!("main_{}", NEXT_ID.fetch_add(1, Ordering::Relaxed)),
    WebviewUrl::App(std::path::PathBuf::from(path.as_ref())),
  )
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
  let builder = builder
    .title(app.package_info().name.clone())
    .maximized(true)
    .enable_clipboard_access()
    .inner_size(900.0, 600.0);

  let window = builder.build()?;

  window_post_init(&window)?;
  Ok(window)
}
