#![cfg(not(target_family = "wasm"))]

#[macro_use]
extern crate tracing;

#[cfg(test)]
#[macro_use]
extern crate rstest;

#[macro_use]
extern crate rust_i18n;

mod commands;
mod error;
mod logging;
mod platform;
mod settings;
mod shared;
mod updater;

use platform::*;

use shared::http_server::start_ping_server;
use shared::AppBuilder;
use tauri::*;

#[macro_export]
macro_rules! include_script {
  ($path: literal) => {
    include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/src/scripts/", $path))
  };
  ($path: literal$(, $($args:tt)+)?) => {
    &format!($crate::include_script!($path)$(, $($args)+)?)
  };
}

i18n!("locales");

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  crate::error::setup_bugsnag_and_panic_hook(option_env!("BUGSNAG_API_KEY").unwrap_or_default().to_string());
  set_locale();

  let builder = Builder::default().init().attach_commands().attach_plugins();

  let context = tauri::tauri_build_context!();
  let app = builder.build(context).expect("Can't build app");
  ensure_required_paths_exist(app.handle());

  if let Err(e) = crate::logging::init(app.handle()) {
    eprintln!("error init logging: {e}");
  }

  #[cfg(any(target_os = "linux", target_os = "windows"))]
  {
    use crate::error::ShowError as _;
    use tauri_plugin_deep_link::DeepLinkExt;
    if !app.deep_link().is_registered("gramax").unwrap_or(false) {
      _ = app.deep_link().register("gramax").or_show();
    }
  };

  let ping_server_app_handle = app.handle().clone();
  start_ping_server(move |req| shared::handle_ping_server(req, &ping_server_app_handle));

  #[cfg(desktop)]
  {
    use crate::updater::legacy::LegacyUpdaterBuilder;
    use crate::updater::UpdaterExt;

    #[cfg(target_family = "unix")]
    app.handle().setup_menu().expect("unable to setup menu");
    app.handle().updater_init().expect("unable to setup updater");
    app.setup_legacy_updater().expect("unable to setup legacy updater");
  }

  app.manage(shared::FocusedWebviewLabel(std::sync::Mutex::new(None)));
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
      .plugin(tauri_plugin_deep_link::init());

    #[cfg(not(target_os = "android"))]
    let app =
      app.plugin(tauri_plugin_window_state::Builder::new().with_filename("gramax-windows-state").build());

    #[cfg(desktop)]
    let app = app
      .plugin(plugin_gramax_fs::init())
      .plugin(tauri_plugin_shell::init())
      .plugin(tauri_plugin_updater::Builder::new().build());

    app
  }

  fn attach_commands(self) -> Self {
    commands::generate_handler(self)
  }
}

fn ensure_required_paths_exist<R: Runtime>(app: &AppHandle<R>) {
  let paths = app.path();

  for path in [paths.document_dir(), paths.app_cache_dir(), paths.app_config_dir(), paths.app_data_dir()] {
    match path {
      Ok(path) if !path.exists() => {
        if let Err(err) = std::fs::create_dir_all(&path) {
          panic!(
            "Required path `{path}` not found & failed to create. Please create it manually. Error: {err:?}",
            path = path.display(),
            err = err
          );
        }
      }
      Err(err) => error!("required path not found: {err}"),
      _ => {}
    }
  }
}
