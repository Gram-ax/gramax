use crate::error::ShowError;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::*;

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
			.zoom_hotkeys_enabled(false)
			.disable_drag_drop_handler()
			.initialization_script(crate::include_script!("add-window-close.js"))
			.on_navigation(crate::platform::make_on_navigate_callback(label.clone(), manager.app_handle().clone()));

		#[cfg(not(target_os = "macos"))]
		let builder = builder.zoom_hotkeys_enabled(true);

		let builder = self.apply_platform_settings(builder, manager);

		let window = builder.build()?;

		crate::platform::init::window_post_init(&window)?;

		self.restore_session(&window)?;
		Ok(window)
	}

	fn get_unique_label<R: Runtime, M: Manager<R>>(&self, manager: &M) -> String {
		if let Some(label) = self.label.clone() {
			return label;
		}

		let mut counter = 0;
		let mut label = format!("gramax-window-{counter}");
		while manager.webview_windows().contains_key(&label) {
			counter += 1;
			label = format!("gramax-window-{counter}");
		}

		label
	}

	fn get_url(&self) -> PathBuf {
		self.path.clone().unwrap_or_else(|| PathBuf::from("index.html"))
	}

	#[cfg(desktop)]
	fn apply_platform_settings<'a, R: Runtime, M: Manager<R>>(
		&self,
		builder: WebviewWindowBuilder<'a, R, M>,
		manager: &M,
	) -> WebviewWindowBuilder<'a, R, M> {
		let builder = builder
			.title(&manager.package_info().name)
			.enable_clipboard_access()
			.inner_size(1000.0, 700.0)
			.accept_first_mouse(true);

		#[cfg(all(desktop, not(target_os = "linux")))]
		let builder = {
			let callback = crate::platform::download_callback::DownloadCallback::new();
			builder.on_download(move |w, e| callback.on_download(w, e))
		};

		#[cfg(target_os = "macos")]
		let builder = builder
			.initialization_script(crate::include_script!("macos-fixes.js"))
			.hidden_title(true)
			.title_bar_style(TitleBarStyle::Overlay);

		#[cfg(target_os = "windows")]
		let builder = {
			let mut flags = vec!["--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection"]; // default flags

			if std::env::var("DISABLE_SSL_CERT_CHECK").is_ok() {
				warn!("ssl certificate check disabled");
				flags.push("--ignore-certificate-errors");
			}

			builder
				.initialization_script(crate::include_script!("windows-fixes.js"))
				.additional_browser_args(&flags.join(" "))
		};

		#[cfg(not(target_os = "macos"))]
		let builder = builder.zoom_hotkeys_enabled(true);

		builder
	}

	#[cfg(mobile)]
	fn apply_platform_settings<'a, R: Runtime, M: Manager<R>>(
		&self,
		builder: WebviewWindowBuilder<'a, R, M>,
		_manager: &M,
	) -> WebviewWindowBuilder<'a, R, M> {
		builder
	}

	fn restore_session<R: Runtime>(&self, window: &WebviewWindow<R>) -> Result<()> {
		use super::session_data::WindowSessionDataExt;

		if let Some(session_data) = &self.session_data {
			window.eval(crate::include_script!("restore-session.js", data = session_data))?;
		} else if let Some(session_data) = window.get_session_data() {
			window.eval(crate::include_script!("restore-session.js", data = session_data))?;
		}
		Ok(())
	}
}

pub fn handle_ping_server<R: Runtime>(req: &tiny_http::Request, app: &AppHandle<R>) {
	use crate::shared::AppHandleExt;

	let path = req.url();
	if path.is_empty() || path == "/" || *req.method() != tiny_http::Method::Get {
		return;
	};

	let window = app.get_focused_or_default_webview();

	if let Some(window) = window {
		let _ = window
			.eval(crate::include_script!("open-url.template.js", url = path.trim_start_matches('/')))
			.or_show();

		#[cfg(desktop)]
		{
			let _ = window.request_user_attention(Some(UserAttentionType::Informational));
			let _ = window.show().or_show();
			let _ = window.unminimize().or_show();
			#[cfg(target_os = "macos")]
			std::thread::sleep(std::time::Duration::from_millis(300));
			let _ = window.set_focus().or_show();
		}
	} else {
		#[allow(unused)]
		let window = MainWindowBuilder::default()
			.url(path)
			.build(app)
			.or_show_with_message(t!("etc.error.build-window").as_ref())
			.unwrap();

		#[cfg(desktop)]
		{
			let _ = window.set_focus().or_show();
		}
	}
}
