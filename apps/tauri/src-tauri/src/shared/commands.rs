use rust_i18n::locale;
use std::collections::HashMap;
use tauri::*;

#[tauri::command]
pub fn read_env() -> HashMap<String, String> {
	let vars = std::env::vars().collect::<HashMap<String, String>>();
	if std::env::var("UPDATE_INSTALLED").is_ok() {
		std::env::remove_var("UPDATE_INSTALLED");
	}
	vars
}

#[tauri::command]
pub fn quit(code: i32) {
	std::process::exit(code)
}

#[command]
pub fn get_user_language() -> String {
	locale().to_string()
}

#[command]
pub fn http_listen_once<R: Runtime>(
	window: Window<R>,
	url: &str,
	action: super::http_server::OauthListenOnceAction,
	callback_name: Box<str>,
) -> Result<()> {
	#[cfg(mobile)]
	{
		let wvs = window.webviews();
		let Some(webview) = wvs.first() else { return Ok(()) };
		let _ = webview.eval(format!("window.location.replace('{url}')"));
	}

	#[cfg(desktop)]
	crate::open_url(url)?;

	super::http_server::oauth_listen_once(action, move |req| window.emit(&callback_name, req.url().split('?').nth(1)).unwrap());

	Ok(())
}

#[command]
pub fn open_in_web(url: &str) -> Result<()> {
	crate::open_url(url)?;
	Ok(())
}

#[command]
pub fn set_session_data<R: Runtime>(window: WebviewWindow<R>, key: &str, data: &str) -> Result<()> {
	use crate::shared::session_data::WindowSessionDataExt;
	window.set_session_data(key, data);
	Ok(())
}
