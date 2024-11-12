use std::borrow::Cow;
use std::str::FromStr;

use tauri::menu::*;
use tauri::*;

use crate::error::ShowError;
use crate::platform::desktop::updater::Updater;
use crate::AppHandleExt;
use crate::MainWindowBuilder;

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
  Unknown,
  #[cfg(target_family = "unix")]
  ZoomIn,
  #[cfg(target_family = "unix")]
  ZoomOut,
  #[cfg(target_family = "unix")]
  ActualSize,
}

impl MenuItemId {
  fn translated(&self) -> Cow<str> {
    match self {
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
      async_runtime::spawn(async move { app.state::<Updater<R>>().check_and_ask().await });
    }
    Id::NewWindow => {
      std::thread::spawn(move || {
        MainWindowBuilder::default().build(&app).or_show_with_message(&t!("etc.error.build-window"))
      });
    }
    Id::CloseWindow => {
      std::thread::spawn(move || app.get_focused_webview().map(|w| w.close()));
    }
    Id::JoinTelegramNews => {
      _ = open::that("https://t.me/gramax_community")
        .or_show_with_message(&t!("etc.error.open-url", url = "https://t.me/gramax_community"));
    }
    Id::JoinTelegramChat => {
      _ = open::that("https://t.me/gramax_chat")
        .or_show_with_message(&t!("etc.error.open-url", url = "https://t.me/gramax_chat"));
    }
    Id::VisitGitHub => {
      _ = open::that("https://github.com/gram-ax/gramax")
        .or_show_with_message(&t!("etc.error.open-url", url = "https://github.com/gram-ax/gramax"));
    }
    Id::VisitDocs => {
      _ = open::that("https://gram.ax/resources/docs")
        .or_show_with_message(&t!("etc.error.open-url", url = "https://gram.ax/resources/docs"));
    }
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
        app.emit_to(EventTarget::webview_window(focused.label()), "actual-size", ()).unwrap();
      }
    }
    _ => (),
  }
}

fn about_metadata<R: Runtime, M: Manager<R>>(app: &M) -> AboutMetadata {
  let package = app.package_info();
  let builder =
    AboutMetadataBuilder::new().name(Some(&package.name)).version(Some(package.version.to_string()));
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
    &build_item(Id::NewWindow, Some("CmdOrControl+T"))?,
    &build_item(Id::CheckUpdate, None)?,
    &PredefinedMenuItem::about(app, Some(&t!("menu.file.about")), Some(about_metadata(app)))?,
    &PredefinedMenuItem::separator(app)?,
    &build_item(Id::CloseWindow, Some("CmdOrControl+W"))?,
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
  ])?;
  menu.append(&help_sub)?;

  Ok(menu)
}
