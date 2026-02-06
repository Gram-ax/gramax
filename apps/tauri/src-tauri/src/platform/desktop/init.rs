use std::path::Path;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::sync::Mutex;

use tauri::*;

use crate::shared::MainWindowBuilder;

use super::save_windows::SaveWindowsExt;

pub static INITED: AtomicBool = AtomicBool::new(false);

pub struct OpenUrl(pub Mutex<Option<String>>);

type InitResult = std::result::Result<(), Box<dyn std::error::Error>>;

pub fn window_post_init<R: Runtime>(_w: &WebviewWindow<R>) -> Result<()> {
	#[cfg(target_os = "macos")]
	_w.with_webview(|webview| unsafe {
		let webview: &objc2_web_kit::WKWebView = &*webview.inner().cast();
		// webview.setAllowsBackForwardNavigationGestures(true);
		webview.setAllowsMagnification(true);
	})?;
	Ok(())
}

pub fn init_app<R: Runtime>(app: &mut App<R>) -> InitResult {
	crate::logging::watch_process(app.handle().clone());

	#[cfg(target_os = "macos")]
	macos_init_spellcheck(&app.config().identifier);

	#[cfg(target_os = "windows")]
	if let Err(e) = windows_init_badges(app) {
		error!("failed to init badges: {}", e);
	}

	app.on_menu_event(super::menu::on_menu_event);

	std::env::remove_var("ROOT_PATH");

	let window = match app.handle().reopen_windows()? {
		Some(window) => window,
		None => MainWindowBuilder::default().build(app)?,
	};

	let opened_path = app
		.try_state::<OpenUrl>()
		.as_deref()
		.and_then(|m| m.0.lock().unwrap().take())
		.or(std::env::args().nth(1));

	if opened_path.is_none() {
		app.manage(OpenUrl(Mutex::new(None)));
	}

	if let Some(ref path) = opened_path {
		let path = path.split_once("://").map(|(_, path)| path).unwrap_or(path.as_str());
		let mut url = window.url()?;
		url.set_path(path);
		info!("open url in window: {label:?}, url: {url}", label = window.label());
		window.navigate(url)?;
	}

	std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());
	std::env::set_var("USER_DATA_PATH", user_data_path(app));
	std::env::set_var("OS", std::env::consts::OS);

	let documents_dir = &app.path().document_dir();

	#[cfg(target_os = "macos")]
	let documents_dir = documents_dir
		.as_ref()
		.expect("Failed to find documents directory: probably $HOME env var is not set");

	#[cfg(target_os = "windows")]
	let documents_dir = documents_dir.as_ref().expect("Failed to find documents directory");

	#[cfg(target_os = "linux")]
	let documents_dir = documents_dir
		.as_ref()
		.expect("Failed to find documents directory: probably $XDG_DOCUMENTS_DIR env var is not set");

	#[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
	let documents_dir = documents_dir.as_ref().expect("Failed to find documents directory");

	std::env::set_var("GRAMAX_DEFAULT_WORKSPACE_PATH", Path::new(documents_dir).join("Gramax/default"));

	INITED.store(true, Ordering::Relaxed);
	Ok(())
}

pub fn user_data_path<R: Runtime, M: Manager<R>>(app: &M) -> std::path::PathBuf {
	app.path().app_config_dir().expect("Config directory doesn't exists")
}

#[cfg(target_os = "macos")]
pub fn macos_init_spellcheck(app_id: &str) {
	let mut cmd = std::process::Command::new("defaults");
	cmd.args(["read", app_id, "WebContinuousSpellCheckingEnabled"]);

	let output = match cmd.output() {
		Ok(output) => output,
		Err(e) => {
			error!("failed to gather output (stdout/stderr) from {cmd:?}; error: {e}");
			return;
		}
	};

	let stderr = String::from_utf8_lossy(&output.stderr);

	/*
	Example output if the key does not exist:
	2025-04-23 20:13:56.113 defaults[42911:5909169]
	The domain/default pair of (gramax.dev, WebContinuousSpellCheckingEnabled) does not exist
	 */
	if !stderr.contains("does not exist") {
		return;
	}

	info!("auto-enabling spellcheck since it wasn't enabled or disabled by user");
	let mut cmd = std::process::Command::new("defaults");
	cmd.args(["write", app_id, "WebContinuousSpellCheckingEnabled", "-bool", "YES"]);

	info!("running: {cmd:?}");
	match cmd.spawn().and_then(|mut p| p.wait()) {
		Ok(_) => {}
		Err(e) => error!("failed to run {cmd:?} command; error: {e}"),
	};
}

#[cfg(target_os = "windows")]
pub struct Badges<'b>(Vec<tauri::image::Image<'b>>);

#[cfg(target_os = "windows")]
impl Badges<'_> {
	pub fn set_badge<R: Runtime>(window: &WebviewWindow<R>, count: Option<usize>) -> tauri::Result<()> {
		let Some(badges) = window.app_handle().try_state::<Badges>() else {
			return Ok(());
		};

		let badge = match count {
			Some(0) | None => return window.set_overlay_icon(None),
			Some(count) => badges.0.get(count.clamp(0, badges.0.len()) - 1).cloned(),
		};

		window.set_overlay_icon(badge)?;
		Ok(())
	}
}

#[cfg(target_os = "windows")]
pub fn windows_init_badges<R: Runtime>(app: &App<R>) -> anyhow::Result<()> {
	const BADGES_BYTES: &[u8] = include_bytes!("../../../icons/badges.tar.xz");

	use std::io::Read;
	use tauri::image::Image;

	let mut xz = Vec::new();
	lzma_rs::xz_decompress(&mut std::io::Cursor::new(BADGES_BYTES), &mut xz)?;
	let mut archive = tar::Archive::new(std::io::Cursor::new(xz));

	let mut badges = Vec::<(usize, Image)>::with_capacity(100);

	for entry in archive.entries()? {
		let mut entry = entry?;
		let mut buf = Vec::<u8>::with_capacity(1024);
		entry.read_to_end(&mut buf)?;
		let name = entry.path()?.to_path_buf();

		let number = name
			.file_name()
			.and_then(|name| name.to_str())
			.and_then(|name| name.split_once("_").map(|(_, num)| num))
			.and_then(|num| num.split_once(".").map(|(num, _)| num))
			.and_then(|num| num.parse::<usize>().ok())
			.unwrap_or(usize::MAX);

		let image = Image::from_bytes(&buf)?;
		badges.push((number, image));
	}

	badges.sort_by(|(a, _), (b, _)| a.cmp(b));
	let badges = Badges(badges.into_iter().map(|(_, image)| image).collect());

	info!("loaded {} badges", badges.0.len());
	app.manage(badges);

	Ok(())
}
