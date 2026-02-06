use std::borrow::Cow;
use std::str::FromStr;
use std::sync::Mutex;

use tauri::menu::*;
use tauri::*;

use crate::error::ShowError;
use crate::shared::AppHandleExt;
use crate::shared::MainWindowBuilder;
use crate::updater::legacy::Updater as LegacyUpdater;

pub trait MenuBuilder {
	fn setup_menu(&self) -> Result<()>;
}

impl<R: Runtime> MenuBuilder for tauri::AppHandle<R> {
	fn setup_menu(&self) -> Result<()> {
		make_menu(self)?.set_as_app_menu()?;
		Ok(())
	}
}

impl<R: Runtime> MenuBuilder for tauri::WebviewWindow<R> {
	fn setup_menu(&self) -> Result<()> {
		self.set_menu(make_menu(self.app_handle())?)?;
		Ok(())
	}
}

#[derive(strum::EnumString, strum::AsRefStr, Clone, Copy)]
pub enum MenuItemId {
	NewWindow,
	CloseWindow,
	CheckUpdate,
	Help,
	JoinTelegramNews,
	JoinTelegramChat,
	VisitGitHub,
	VisitDocs,
	Reload,
	Refresh,
	ToggleInspector,
	EnterpriseConfigure,
	ToggleSpellcheck,
	ShowLogs,
	ExportLogs,
	Unknown,
	#[cfg(target_family = "unix")]
	ZoomIn,
	#[cfg(target_family = "unix")]
	ZoomOut,
	#[cfg(target_family = "unix")]
	ActualSize,
}

impl MenuItemId {
	fn translated(&self) -> Cow<'_, str> {
		match self {
			MenuItemId::EnterpriseConfigure => t!("menu.file.configure"),
			MenuItemId::NewWindow => t!("menu.file.new-window"),
			MenuItemId::CloseWindow => t!("menu.file.close-window"),
			MenuItemId::CheckUpdate => t!("updates.check"),
			MenuItemId::Help => t!("menu.help"),
			MenuItemId::JoinTelegramNews => t!("menu.help.telegram-news"),
			MenuItemId::JoinTelegramChat => t!("menu.help.telegram-chat"),
			MenuItemId::VisitGitHub => t!("menu.help.visit-github"),
			MenuItemId::VisitDocs => t!("menu.help.visit-docs"),
			#[cfg(target_family = "unix")]
			MenuItemId::ZoomIn => t!("menu.view.zoom-in"),
			#[cfg(target_family = "unix")]
			MenuItemId::ZoomOut => t!("menu.view.zoom-out"),
			#[cfg(target_family = "unix")]
			MenuItemId::ActualSize => t!("menu.view.actual-size"),
			MenuItemId::ToggleSpellcheck => t!("menu.edit.toggle-spellcheck"),
			MenuItemId::ExportLogs => t!("menu.help.export-logs"),
			MenuItemId::ShowLogs => t!("menu.help.show-logs"),
			_ => Cow::Owned("unknown".to_string()),
		}
	}
}

pub fn search_menu<R: Runtime>(menu: &Menu<R>, id: MenuItemId) -> Option<MenuItemKind<R>> {
	if let Ok(items) = menu.items() {
		return items.iter().find_map(|item_kind| match item_kind {
			MenuItemKind::Submenu(submenu) => submenu.get(id.as_ref()),
			kind if kind.id() == id.as_ref() => Some(kind.clone()),
			_ => None,
		});
	}
	None
}

static SPELLCHECK_ENABLED: Mutex<bool> = Mutex::new(false);

#[command]
pub fn set_menuitem_spellcheck_enabled<R: Runtime>(window: WebviewWindow<R>, new_enabled: bool) -> Result<()> {
	let mut enabled = SPELLCHECK_ENABLED.lock().unwrap();

	if *enabled == new_enabled {
		return Ok(());
	}

	#[cfg(not(target_os = "windows"))]
	{
		let Some(menu) = window.app_handle().menu() else {
			return Ok(());
		};

		let Some(item) = search_menu(&menu, MenuItemId::ToggleSpellcheck) else {
			return Ok(());
		};

		item.as_check_menuitem_unchecked().set_checked(new_enabled)?;
	}

	#[cfg(target_os = "windows")]
	{
		for window in window.app_handle().webview_windows().values() {
			if let Some(menu) = window.menu() {
				if let Some(item) = search_menu(&menu, MenuItemId::ToggleSpellcheck) {
					item.as_check_menuitem_unchecked().set_checked(new_enabled)?;
				}
			}
		}
	}

	*enabled = new_enabled;
	Ok(())
}

pub fn on_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
	use MenuItemId as Id;
	let app = app.clone();

	match Id::from_str(event.id().as_ref()).unwrap_or(Id::Unknown) {
		Id::ToggleInspector => {
			if let Some(window) = app.get_focused_webview() {
				window.open_devtools();
			}
		}
		Id::Reload => {
			if let Some(focused) = app.get_focused_webview() {
				app.emit_to(EventTarget::webview_window(focused.label()), "reload", ()).unwrap();
			}
		}
		Id::Refresh => {
			if let Some(focused) = app.get_focused_webview() {
				app.emit_to(EventTarget::webview_window(focused.label()), "refresh", ()).unwrap();
			}
		}
		Id::CheckUpdate => {
			async_runtime::spawn(async move { app.state::<LegacyUpdater<R>>().check_and_ask().await });
		}
		Id::NewWindow => {
			std::thread::spawn(move || {
				MainWindowBuilder::default()
					.build(&app)
					.or_show_with_message(&t!("etc.error.build-window"))
			});
		}
		Id::EnterpriseConfigure => {
			if let Some(window) = app.get_focused_webview() {
				app
					.emit_to(EventTarget::webview_window(window.label()), "enterprise-configure", ())
					.unwrap();
			}
		}
		Id::ToggleSpellcheck => {
			app.emit("on_toggle_spellcheck", ()).unwrap();
		}
		Id::CloseWindow => {
			std::thread::spawn(move || app.get_focused_webview().map(|w| w.close()));
		}
		Id::JoinTelegramNews => _ = crate::open_url("https://t.me/gramax_community"),
		Id::JoinTelegramChat => _ = crate::open_url("https://t.me/gramax_chat"),
		Id::VisitGitHub => _ = crate::open_url("https://github.com/gram-ax/gramax"),
		Id::VisitDocs => _ = crate::open_url("https://gram.ax/resources/docs"),
		#[cfg(target_family = "unix")]
		Id::ZoomIn => {
			if let Some(focused) = app.get_focused_webview() {
				app.emit_to(EventTarget::webview_window(focused.label()), "zoom-in", ()).unwrap();
			}
		}
		#[cfg(target_family = "unix")]
		Id::ZoomOut => {
			if let Some(focused) = app.get_focused_webview() {
				app.emit_to(EventTarget::webview_window(focused.label()), "zoom-out", ()).unwrap();
			}
		}
		#[cfg(target_family = "unix")]
		Id::ActualSize => {
			if let Some(focused) = app.get_focused_webview() {
				#[cfg(target_os = "macos")]
				{
					focused
						.with_webview(|wv| unsafe {
							let wv: &objc2_web_kit::WKWebView = &*wv.inner().cast();
							wv.setPageZoom(1.0);
							wv.setMagnification(1.0);
						})
						.unwrap();
				}
				#[cfg(not(target_os = "macos"))]
				{
					app.emit_to(EventTarget::webview_window(focused.label()), "actual-size", ()).unwrap();
				}
			}
		}
		Id::ExportLogs => {
			std::thread::spawn(move || {
				_ = crate::logging::collect_logs(&app).or_show();
			});
		}
		Id::ShowLogs => {
			let Ok(data_dir) = app.path().app_data_dir().or_show() else {
				return;
			};

			if data_dir.join("logs").exists() {
				_ = open::that_detached(data_dir.join("logs")).or_show();
			} else {
				_ = open::that_detached(data_dir).or_show();
			}
		}
		_ => (),
	}
}

fn about_metadata<R: Runtime, M: Manager<R>>(app: &M) -> AboutMetadata<'_> {
	let package = app.package_info();
	let builder = AboutMetadataBuilder::new()
		.name(Some(&package.name))
		.version(Some(package.version.to_string()));
	builder.build()
}

fn make_menu<R: Runtime>(app: &AppHandle<R>) -> Result<Menu<R>> {
	let build_item = |id: MenuItemId, accelerator: Option<&str>| {
		let item = MenuItemBuilder::with_id(MenuId(id.as_ref().into()), id.translated());
		match accelerator {
			Some(accelerator) => item.accelerator(accelerator),
			None => item,
		}
		.build(app)
	};

	let menu = Menu::new(app)?;

	#[cfg(target_family = "unix")]
	let main_sub = {
		let app_name = &app.package_info().name;
		Submenu::new(app, app_name, true)?
	};

	#[cfg(target_os = "windows")]
	let main_sub = Submenu::new(app, t!("menu.file"), true)?;

	use MenuItemId as Id;

	main_sub.append_items(&[
		&build_item(Id::NewWindow, Some("CmdOrControl+N"))?,
		&build_item(Id::CheckUpdate, None)?,
		&build_item(Id::EnterpriseConfigure, None)?,
		&PredefinedMenuItem::about(app, Some(&t!("menu.file.about")), Some(about_metadata(app)))?,
		&PredefinedMenuItem::separator(app)?,
		&build_item(Id::CloseWindow, Some("CmdOrControl+W"))?,
		#[cfg(target_os = "macos")]
		&PredefinedMenuItem::hide(app, Some(&t!("menu.file.hide")))?,
		&PredefinedMenuItem::quit(app, Some(&t!("menu.file.quit")))?,
	])?;

	menu.append(&main_sub)?;

	let edit_sub = Submenu::new(app, &t!("menu.edit"), true)?;
	edit_sub.append_items(&[
		&PredefinedMenuItem::undo(app, Some(&t!("menu.edit.undo")))?,
		&PredefinedMenuItem::redo(app, Some(&t!("menu.edit.redo")))?,
		&PredefinedMenuItem::separator(app)?,
		&PredefinedMenuItem::cut(app, Some(&t!("menu.edit.cut")))?,
		&PredefinedMenuItem::copy(app, Some(&t!("menu.edit.copy")))?,
		&PredefinedMenuItem::paste(app, Some(&t!("menu.edit.paste")))?,
		&PredefinedMenuItem::select_all(app, Some(&t!("menu.edit.select-all")))?,
		&CheckMenuItemBuilder::with_id(Id::ToggleSpellcheck.as_ref(), &t!("menu.edit.spellcheck"))
			.checked(*SPELLCHECK_ENABLED.lock().unwrap())
			.build(app)?,
	])?;

	menu.append(&edit_sub)?;
	let window_menu = Submenu::new(app, &t!("menu.window"), true)?;
	window_menu.append_items(&[
		&MenuItemBuilder::with_id(Id::ToggleInspector.as_ref(), &t!("menu.window.toggle-inspector"))
			.accelerator("f12")
			.build(app)?,
		&MenuItemBuilder::with_id(Id::Refresh.as_ref(), &t!("menu.window.refresh"))
			.accelerator("CmdOrControl+R")
			.build(app)?,
		&MenuItemBuilder::with_id(Id::Reload.as_ref(), &t!("menu.window.reload"))
			.accelerator("CmdOrControl+Shift+R")
			.build(app)?,
		&PredefinedMenuItem::separator(app)?,
		&PredefinedMenuItem::fullscreen(app, Some(&t!("menu.window.fullscreen")))?,
		&PredefinedMenuItem::maximize(app, Some(&t!("menu.window.maximize")))?,
		&PredefinedMenuItem::minimize(app, Some(&t!("menu.window.minimize")))?,
	])?;

	menu.append(&window_menu).unwrap();

	#[cfg(target_family = "unix")]
	{
		let view_menu = Submenu::new(app, &t!("menu.view"), true)?;
		view_menu.append_items(&[
			&build_item(MenuItemId::ZoomIn, Some("CmdOrControl+="))?,
			&build_item(MenuItemId::ZoomOut, Some("CmdOrControl+-"))?,
			&build_item(MenuItemId::ActualSize, Some("CmdOrControl+0"))?,
		])?;

		menu.append(&view_menu)?;
	}

	let help_sub = Submenu::new(app, t!("menu.help"), true)?;
	help_sub.append_items(&[
		&build_item(Id::VisitDocs, None)?,
		&build_item(Id::VisitGitHub, None)?,
		&build_item(Id::JoinTelegramNews, None)?,
		&build_item(Id::JoinTelegramChat, None)?,
		&PredefinedMenuItem::separator(app)?,
		&build_item(Id::ShowLogs, None)?,
		&build_item(Id::ExportLogs, None)?,
	])?;
	menu.append(&help_sub)?;

	Ok(menu)
}
