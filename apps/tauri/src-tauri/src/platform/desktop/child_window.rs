use tauri::*;

use crate::ALLOWED_DOMAINS;

pub enum ChildWindow {
  Settings,
}

impl ChildWindow {
  pub fn create_exact<R: Runtime>(self, app: &AppHandle<R>) -> Result<Window<R>> {
    match self {
      Self::Settings => {
        ChildWindow::create(app, "settings", WindowUrl::App("settings.html".into()), move |b| {
          #[cfg(target_os = "macos")]
          let b = b.hidden_title(true);
          b.resizable(false)
            .minimizable(false)
            .closable(false)
            .always_on_top(true)
            .center()
            .inner_size(700.0, 250.0)
        })
      }
    }
  }

  pub fn create<R: Runtime, F: FnOnce(WindowBuilder<R>) -> WindowBuilder<R>>(
    app: &AppHandle<R>,
    label: &str,
    url: WindowUrl,
    hook: F,
  ) -> Result<Window<R>> {
    if let Some(window) = app.get_window(label) {
      window.set_focus()?;
      return Ok(window);
    }

    let builder = WindowBuilder::new(app, label, url)
      .initialization_script(include_str!("../../init.js"))
      .on_navigation(|url| url.domain().is_some_and(|domain| ALLOWED_DOMAINS.contains(&domain)))
      .enable_clipboard_access();

    let builder = hook(builder);

    #[cfg(target_os = "windows")]
    let builder = { builder.decorations(false) };

    #[cfg(target_os = "macos")]
    let builder = {
      match app.get_focused_window().and_then(|window| window.ns_window().ok()) {
        Some(parent) => builder.parent_window(parent),
        None => builder,
      }
      .title_bar_style(TitleBarStyle::Overlay)
    };

    builder.build()
  }
}
