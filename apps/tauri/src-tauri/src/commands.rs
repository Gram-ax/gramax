use tauri::*;

use crate::platform::commands::*;
use crate::settings;
use crate::shared::commands::*;
use crate::shared::http_req;

pub fn generate_handler<R: Runtime>(builder: Builder<R>) -> Builder<R> {
  builder.invoke_handler(generate_handler![
    crate::logging::js_log,
    read_env,
    quit,
    get_user_language,
    http_listen_once,
    open_in_web,
    http_req::http_request,
    settings::get_settings,
    settings::set_settings,
    close_current_window,
    #[cfg(desktop)]
    minimize_window,
    #[cfg(desktop)]
    new_window,
    #[cfg(desktop)]
    open_directory,
    #[cfg(desktop)]
    open_in_explorer,
    #[cfg(desktop)]
    open_window_with_url,
    #[cfg(desktop)]
    move_to_trash,
    #[cfg(desktop)]
    crate::updater::update_check,
    #[cfg(desktop)]
    crate::updater::update_install,
    #[cfg(desktop)]
    crate::updater::update_cache_clear,
    #[cfg(desktop)]
    crate::updater::update_install_by_path,
    #[cfg(desktop)]
    crate::updater::restart_app,
    #[cfg(target_os = "macos")]
    history_back_forward_go,
    #[cfg(target_os = "macos")]
    history_back_forward_can_go,
    set_language,
    set_session_data,
    #[cfg(target_os = "macos")]
    show_print,
    set_badge
  ])
}
