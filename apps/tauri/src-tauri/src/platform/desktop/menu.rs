use std::borrow::Cow;
use std::str::FromStr;

use tauri::menu::*;
use tauri::*;
use tauri_plugin_dialog::DialogExt;

use crate::build_main_window;
use crate::platform::desktop::open_help_docs;
use crate::platform::desktop::updater::Updater;
use crate::AppHandleExt;

pub trait MenuBuilder {
  fn setup_menu(&self) -> Result<()>;
}

impl<R: Runtime> MenuBuilder for tauri::App<R> {
  fn setup_menu(&self) -> Result<()> {
    make_menu(self.handle())?.set_as_app_menu()?;
    self.on_menu_event(on_menu_event);
    Ok(())
  }
}

impl<R: Runtime> MenuBuilder for tauri::WebviewWindow<R> {
  fn setup_menu(&self) -> Result<()> {
    self.set_menu(make_menu(self.app_handle())?)?;
    self.on_menu_event(|w, e| on_menu_event(w.app_handle(), e));
    Ok(())
  }
}

#[derive(strum::EnumString, strum::AsRefStr, Clone, Copy)]
pub enum MenuItemId {
  NewWindow,
  CloseWindow,
  CheckUpdate,
  Help,
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
      MenuItemId::NewWindow => t!("menu.new-window"),
      MenuItemId::CloseWindow => t!("menu.close-window"),
      MenuItemId::CheckUpdate => t!("updates.check"),
      MenuItemId::Help => t!("menu.help"),
      #[cfg(target_family = "unix")]
      MenuItemId::ZoomIn => Cow::Owned("Zoom In".into()),
      #[cfg(target_family = "unix")]
      MenuItemId::ZoomOut => Cow::Owned("Zoom Out".into()),
      #[cfg(target_family = "unix")]
      MenuItemId::ActualSize => Cow::Owned("Actual Size".into()),
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

fn on_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
  use MenuItemId as Id;
  let app = app.clone();

  match Id::from_str(event.id().as_ref()).unwrap_or(Id::Unknown) {
    Id::Help => {
      if let Err(err) = open_help_docs() {
        app.dialog().message(format!("Can't open docs: {:?}", err)).blocking_show();
      }
    }
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
      std::thread::spawn(move || build_main_window(&app).unwrap());
    }
    Id::CloseWindow => {
      std::thread::spawn(move || app.get_focused_webview().map(|w| w.close()));
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
  let main_sub = Submenu::new(app, "File", true)?;

  use MenuItemId as Id;

  main_sub.append_items(&[
    &build_item(Id::NewWindow, Some("CmdOrControl+T"))?,
    &build_item(Id::CheckUpdate, None)?,
    &PredefinedMenuItem::about(app, Some(&t!("menu.about")), Some(about_metadata(app)))?,
    &PredefinedMenuItem::separator(app)?,
    &build_item(Id::CloseWindow, Some("CmdOrControl+W"))?,
    &PredefinedMenuItem::hide(app, Some(&t!("menu.hide")))?,
    &PredefinedMenuItem::quit(app, Some(&t!("menu.quit")))?,
  ])?;

  menu.append(&main_sub)?;

  let edit_sub = Submenu::new(app, "Edit", true)?;
  edit_sub.append_items(&[
    &PredefinedMenuItem::undo(app, None)?,
    &PredefinedMenuItem::redo(app, None)?,
    &PredefinedMenuItem::separator(app)?,
    &PredefinedMenuItem::cut(app, None)?,
    &PredefinedMenuItem::copy(app, None)?,
    &PredefinedMenuItem::paste(app, None)?,
    &PredefinedMenuItem::select_all(app, None)?,
  ])?;

  menu.append(&edit_sub)?;

  let window_menu = Submenu::new(app, "Window", true)?;
  window_menu.append_items(&[
    &MenuItemBuilder::with_id(Id::ToggleInspector.as_ref(), "Open Inspector")
      .accelerator("f12")
      .build(app)?,
    &MenuItemBuilder::with_id(Id::Refresh.as_ref(), "Refresh").accelerator("CmdOrControl+R").build(app)?,
    &MenuItemBuilder::with_id(Id::Reload.as_ref(), "Reload")
      .accelerator("CmdOrControl+Shift+R")
      .build(app)?,
    &PredefinedMenuItem::separator(app)?,
    &PredefinedMenuItem::fullscreen(app, None)?,
    &PredefinedMenuItem::maximize(app, None)?,
    &PredefinedMenuItem::minimize(app, None)?,
  ])?;

  menu.append(&window_menu).unwrap();

  #[cfg(target_family = "unix")]
  {
    let view_menu = Submenu::new(app, "View", true)?;
    view_menu.append_items(&[
      &build_item(MenuItemId::ZoomIn, Some("CmdOrControl+="))?,
      &build_item(MenuItemId::ZoomOut, Some("CmdOrControl+-"))?,
      &build_item(MenuItemId::ActualSize, Some("CmdOrControl+0"))?,
    ])?;

    menu.append(&view_menu)?;
  }

  let help_sub = Submenu::new(app, "Help", true)?;
  help_sub.append(&MenuItemBuilder::with_id(Id::Help.as_ref(), "Help").build(app)?)?;
  menu.append(&help_sub)?;

  Ok(menu)
}
