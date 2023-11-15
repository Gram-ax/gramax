use std::str::FromStr;

use tauri::menu::*;
use tauri::*;

use crate::build_main_window;
use crate::child_window::PredefinedChildWindow;
use crate::platform::desktop::updater::AppUpdater;

use super::open_help_docs;

use crate::translation::*;

pub trait MenuBuilder<R: Runtime> {
  fn setup_menu(&self);
}

impl<R: Runtime> MenuBuilder<R> for tauri::App<R> {
  fn setup_menu(&self) {
    let language = Language::detect_user_language();
    let menu = create_menu(self, language);
    self.set_menu(menu.clone()).expect("unable to set menu");
    self.manage(MenuHandle(menu));
    self.on_menu_event(on_event);
  }
}

pub struct MenuHandle<R: Runtime>(Menu<R>);

impl<R: Runtime> MenuHandle<R> {
  pub fn get(&self, id: MenuItemId) -> Option<MenuItemKind<R>> {
    if let Ok(items) = self.0.items() {
      return items.iter().find_map(move |item_kind| match item_kind {
        MenuItemKind::Submenu(submenu) => submenu.get(id.as_ref()),
        kind if kind.id() == id.as_ref() => Some(kind.clone()),
        _ => None,
      });
    }
    None
  }

  pub fn update_item(&self) -> MenuItem<R> {
    let kind = self.get(MenuItemId::CheckUpdate).unwrap();
    kind.as_menuitem_unchecked().to_owned()
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

fn on_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
  use MenuItemId as Id;

  match Id::from_str(event.id().as_ref()).unwrap_or(Id::Unknown) {
    Id::Help => {
      if let Err(err) = open_help_docs(app) {
        error!("Can't open docs: {:?}", err);
      }
    }
    Id::Settings => {
      PredefinedChildWindow::Settings.create(app).unwrap();
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
      let app = app.clone();
      async_runtime::spawn(async move { app.state::<AppUpdater<R>>().check_and_ask().await });
    }
    Id::NewWindow => {
      build_main_window(app).unwrap();
    }
    Id::CloseWindow => {
      let app = app.clone();
      std::thread::spawn(move || {
        app.get_focused_window().map(|w| w.close());
      });
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

fn create_menu<R: Runtime, M: Manager<R>>(app: &M, language: Language) -> Menu<R> {
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

  #[cfg(target_os = "macos")]
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
