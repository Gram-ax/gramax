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
    app.setup_legacy_updater().expect("unable to setup legacy updater");
    app.handle().updater_init().expect("unable to setup updater");
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
