use std::borrow::Cow;

use opentelemetry::trace::Status;
use tauri::menu::MenuItem;
use tauri::*;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::MessageDialogButtons;
use tauri_plugin_dialog::MessageDialogKind;
use tracing_opentelemetry::OpenTelemetrySpanExt;

use crate::shared::AppHandleExt;
use crate::updater::UpdaterExt as _;

use crate::platform::menu::search_menu;
use crate::platform::menu::MenuItemId;

const TAG: &str = "legacy-updater";

pub trait LegacyUpdaterBuilder<R: Runtime> {
	fn setup_legacy_updater(&self) -> tauri::Result<()>;
}

impl<R: Runtime> LegacyUpdaterBuilder<R> for tauri::App<R> {
	fn setup_legacy_updater(&self) -> tauri::Result<()> {
		let updater = Updater::new(self.app_handle().clone());
		self.manage(updater);
		Ok(())
	}
}

pub struct Updater<R: Runtime> {
	app: AppHandle<R>,
}

impl<R: Runtime> Updater<R> {
	pub fn new(app: AppHandle<R>) -> Self {
		Self { app }
	}

	#[instrument(skip(self))]
	pub async fn check_and_ask(&self) -> tauri::Result<()> {
		let menu_item = self.get_menu_item();
		if menu_item.as_ref().is_some_and(|m| !m.is_enabled().unwrap_or(true)) {
			info!(target: TAG, "update check already in progress; skip");
			return Ok(());
		}

		self.set_menu_enabled(menu_item.as_ref(), false)?;
		let result = self.app.updater().check(true).await;
		self.set_menu_enabled(menu_item.as_ref(), true)?;

		match result {
			Ok(()) => {
				if !self.app.updater().is_ready() {
					self.show_dialog(MessageDialogKind::Info, t!("updates.you-have-actual-ver.title"), t!("updates.you-have-actual-ver.body"), MessageDialogButtons::Ok);
					return Ok(());
				}

				let accepted = self.show_dialog(MessageDialogKind::Info, t!("updates.new-version.title"), t!("updates.new-version.body"), MessageDialogButtons::OkCancel);
				if accepted {
					if let Err(err) = self.app.updater().install() {
						tracing::Span::current().set_status(Status::Error { description: Cow::Owned(err.to_string()) });
						self.show_dialog(MessageDialogKind::Error, t!("updates.error-occured"), t!("etc.try-later"), MessageDialogButtons::Ok);
					}
				}
			}
			Err(err) => {
				tracing::Span::current().set_status(Status::Error { description: Cow::Owned(err.to_string()) });
				self.show_dialog(MessageDialogKind::Error, t!("updates.error-occured"), t!("etc.try-later"), MessageDialogButtons::Ok);
			}
		}

		Ok(())
	}

	fn show_dialog(&self, kind: MessageDialogKind, title: impl Into<String>, message: impl Into<String>, buttons: MessageDialogButtons) -> bool {
		let dialog = self.app.dialog().message(message.into()).title(title.into()).kind(kind).buttons(buttons);

		let dialog = match self.app.get_focused_or_default_webview() {
			Some(w) => dialog.parent(&w),
			None => dialog,
		};

		dialog.blocking_show()
	}

	fn set_menu_enabled(&self, item: Option<&MenuItem<R>>, enabled: bool) -> tauri::Result<()> {
		let Some(item) = item else { return Ok(()) };

		item.set_enabled(enabled)?;
		if enabled {
			item.set_text(t!("updates.check"))?;
		} else {
			item.set_text(t!("updates.check-in-progress"))?;
		};

		Ok(())
	}

	fn get_menu_item(&self) -> Option<MenuItem<R>> {
		let menu = self.app.menu().or_else(|| self.app.get_focused_webview().and_then(|w| w.menu()))?;
		let item = search_menu(&menu, MenuItemId::CheckUpdate)?;
		item.as_menuitem().cloned()
	}
}

