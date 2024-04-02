use std::str::FromStr;

use tauri::menu::*;
use tauri::*;
use tauri_plugin_dialog::DialogExt;

use crate::build_main_window;
use crate::platform::child_window::ChildWindow;
use crate::platform::desktop::open_help_docs;
use crate::platform::desktop::updater::Updater;
use crate::translation::*;

pub trait MenuBuilder {
  fn setup_menu(&self) -> Result<()>;
}

impl<R: Runtime> MenuBuilder for tauri::App<R> {
  fn setup_menu(&self) -> Result<()> {
    make_menu(self.handle()).set_as_app_menu()?;
    self.on_menu_event(on_menu_event);
    Ok(())
  }
}

impl<R: Runtime> MenuBuilder for tauri::Window<R> {
  fn setup_menu(&self) -> Result<()> {
    make_menu(self.app_handle()).set_as_window_menu(self)?;
    self.on_menu_event(|w, e| on_menu_event(w.app_handle(), e));
    Ok(())
  }
}

#[derive(strum::EnumString, strum::AsRefStr, Clone, Copy)]
pub enum MenuItemId {
  NewWindow,
  Settings,
  CloseWindow,
  CheckUpdate,
  Help,
  Reload,
  Refresh,
  ToggleInspector,
  Unknown,
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
    Id::Settings => {
      ChildWindow::Settings.create_exact(&app).unwrap();
    }
    Id::ToggleInspector => {
      if let Some(window) = app.get_focused_window() {
        window.open_devtools()
      }
    }
    Id::Reload => {
      if let Some(window) = app.get_focused_window() {
        window.emit("reload", ()).unwrap();
      }
    }
    Id::Refresh => {
      if let Some(window) = app.get_focused_window() {
        window.emit("refresh", ()).unwrap();
      }
    }
    Id::CheckUpdate => {
      async_runtime::spawn(async move { app.state::<Updater<R>>().check_and_ask().await });
    }
    Id::NewWindow => {
      std::thread::spawn(move || build_main_window(&app).unwrap());
    }
    Id::CloseWindow => {
      std::thread::spawn(move || app.get_focused_window().map(|w| w.close()));
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

fn make_menu<R: Runtime>(app: &AppHandle<R>) -> Menu<R> {
  let language = Language::detect_user_language();
  let build_item = |id: MenuItemId, accelerator: Option<&str>| {
    let text = language.translate(id.into());
    let item = MenuItemBuilder::with_id(MenuId(id.as_ref().into()), text);
    match accelerator {
      Some(accelerator) => item.accelerator(accelerator),
      None => item,
    }
    .build(app)
  };

  let menu = Menu::new(app);

  #[cfg(target_family = "unix")]
  let main_sub = {
    let app_name = &app.package_info().name;
    Submenu::new(app, app_name, true)
  };

  #[cfg(target_os = "windows")]
  let main_sub = Submenu::new(app, "File", true);

  use MenuItemId as Id;

  main_sub
    .append_items(&[
      &build_item(Id::NewWindow, Some("CmdOrControl+T")),
      &build_item(Id::Settings, None),
      &build_item(Id::CheckUpdate, None),
      &PredefinedMenuItem::about(
        app,
        Some(&language.translate(Translation::About)),
        Some(about_metadata(app)),
      ),
      &PredefinedMenuItem::separator(app),
      &build_item(Id::CloseWindow, Some("CmdOrControl+W")),
      &PredefinedMenuItem::hide(app, Some(&language.translate(Translation::Hide))),
      &PredefinedMenuItem::quit(app, Some(&language.translate(Translation::Quit))),
    ])
    .unwrap();

  menu.append(&main_sub).unwrap();

  let edit_sub = Submenu::new(app, "Edit", true);
  edit_sub
    .append_items(&[
      &PredefinedMenuItem::undo(app, None),
      &PredefinedMenuItem::redo(app, None),
      &PredefinedMenuItem::separator(app),
      &PredefinedMenuItem::cut(app, None),
      &PredefinedMenuItem::copy(app, None),
      &PredefinedMenuItem::paste(app, None),
      &PredefinedMenuItem::select_all(app, None),
    ])
    .unwrap();

  menu.append(&edit_sub).unwrap();

  let window_menu = Submenu::new(app, "Window", true);
  window_menu
    .append_items(&[
      &MenuItemBuilder::with_id(Id::ToggleInspector.as_ref(), "Open Inspector").accelerator("f12").build(app),
      &MenuItemBuilder::with_id(Id::Refresh.as_ref(), "Refresh").accelerator("CmdOrControl+R").build(app),
      &MenuItemBuilder::with_id(Id::Reload.as_ref(), "Reload").accelerator("CmdOrControl+Shift+R").build(app),
      &PredefinedMenuItem::separator(app),
      &PredefinedMenuItem::fullscreen(app, None),
      &PredefinedMenuItem::maximize(app, None),
      &PredefinedMenuItem::minimize(app, None),
    ])
    .unwrap();

  menu.append(&window_menu).unwrap();

  let help_sub = Submenu::new(app, "Help", true);
  help_sub.append(&MenuItemBuilder::with_id(Id::Help.as_ref(), "Help").build(app)).unwrap();
  menu.append(&help_sub).unwrap();

  menu
}
