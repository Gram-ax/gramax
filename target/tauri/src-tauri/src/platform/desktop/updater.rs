use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::time::Duration;

use tauri::menu::MenuItem;
use tauri::Result;
use tauri::*;
use tauri_plugin_updater::*;

use tauri::process::restart;

use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::MessageDialogKind;
use tauri_plugin_updater as updater;

use semver::Prerelease;
use semver::Version;

use crate::translation::*;

use super::menu::search_menu;
use super::menu::MenuItemId;

pub trait AppUpdaterBuilder<R: Runtime> {
  fn setup_updater(&self) -> updater::Result<()>;
}

impl<R: Runtime> AppUpdaterBuilder<R> for tauri::App<R> {
  fn setup_updater(&self) -> updater::Result<()> {
    let updater = AppUpdater::new(self.app_handle().clone())?;
    self.manage(updater);
    AppUpdater::start_background_check(self.app_handle().clone(), Duration::from_secs(3600 * 6));
    Ok(())
  }
}

pub struct AppUpdater<R: Runtime> {
  app: AppHandle<R>,
  updater: Updater,
  language: Language,
}

impl<R: Runtime> AppUpdater<R> {
  pub fn new(app: AppHandle<R>) -> updater::Result<Self> {
    let updater = app.updater_builder().version_comparator(|v, r| compare_versions(v, r.version)).build()?;
    let language = *app.state::<Language>().inner();
    Ok(Self { app, updater, language })
  }

  pub async fn check_and_ask(&self) -> Result<()> {
    let Some(menu_item) = self.get_menu_item() else {
      return Ok(());
    };
    if !menu_item.is_enabled()? {
      warn!("update checking is disabled");
      return Ok(());
    }

    let installer = AppUpdateInstaller::new(&self.app, Some(&menu_item));

    self.set_menu_enabled(Some(&menu_item), false)?;

    if let Err(err) = self.check(installer, false).await {
      self
        .app
        .dialog()
        .message(format!("{:?}\n{}", err, self.language.translate(Translation::TryLater)))
        .kind(MessageDialogKind::Error)
        .title(self.language.translate(Translation::ErrorWhileUpdating))
        .blocking_show();
    }

    self.set_menu_enabled(Some(&menu_item), true)?;

    Ok(())
  }

  pub async fn check_quiet_and_ask(&self) -> updater::Result<()> {
    info!("check for updates quiet");
    let menu_item = self.get_menu_item();
    let installer = AppUpdateInstaller::new(&self.app, menu_item.as_ref());

    _ = self.set_menu_enabled(menu_item.as_ref(), false);
    let res = self.check(installer, true).await;
    _ = self.set_menu_enabled(menu_item.as_ref(), true);
    res
  }

  fn ask(&self) -> bool {
    self
      .app
      .dialog()
      .message(self.language.translate(Translation::UpdateNowBody))
      .title(self.language.translate(Translation::NewVersion))
      .ok_button_label(self.language.translate(Translation::UpdateNow))
      .cancel_button_label(self.language.translate(Translation::DeclineUpdate))
      .blocking_show()
  }

  fn start_background_check(app: AppHandle<R>, interval: Duration) {
    async_runtime::spawn(async move {
      let mut interval = tokio::time::interval(interval);
      let updater = app.state::<AppUpdater<R>>();
      loop {
        interval.tick().await;
        if let Err(err) = updater.check_quiet_and_ask().await {
          warn!("An error occurred while checking for updates: {:?}", err);
        }
      }
    });
  }

  async fn check(&self, installer: AppUpdateInstaller<'_, R>, quiet: bool) -> updater::Result<()> {
    match self.updater.check().await? {
      Some(update) if quiet => {
        let bytes = installer.download(&update).await?;
        if self.ask() {
          installer.install(&update, bytes)?;
        }
        Ok(())
      }
      Some(update) if self.ask() => installer.install(&update, installer.download(&update).await?),
      _ if !quiet => {
        self
          .app
          .dialog()
          .message(self.language.translate(Translation::YouHaveActualVersionBody))
          .title(self.language.translate(Translation::YouHaveActualVersion))
          .ok_button_label(self.language.translate(Translation::UpdateOk))
          .blocking_show();
        Ok(())
      }
      _ => Ok(()),
    }
  }

  fn set_menu_enabled(&self, item: Option<&MenuItem<R>>, enabled: bool) -> tauri::Result<()> {
    let Some(item) = item else { return Ok(()) };

    item.set_enabled(enabled)?;
    if enabled {
      item.set_text(self.language.translate(Translation::CheckUpdate))?;
    } else {
      item.set_text(self.language.translate(Translation::CheckingForUpdate))?;
    };

    Ok(())
  }

  fn get_menu_item(&self) -> Option<MenuItem<R>> {
    let menu = self.app.menu().or_else(|| self.app.get_focused_window().and_then(|w| w.menu()))?;
    let item = search_menu(&menu, MenuItemId::CheckUpdate)?;
    item.as_menuitem().cloned()
  }
}

struct AppUpdateInstaller<'u, R: Runtime> {
  app: &'u AppHandle<R>,
  menu_item: Option<&'u MenuItem<R>>,
}

impl<'u, R: Runtime> AppUpdateInstaller<'u, R> {
  fn new(app: &'u AppHandle<R>, menu_item: Option<&'u MenuItem<R>>) -> Self {
    Self { app, menu_item }
  }

  async fn download(&self, update: &Update) -> updater::Result<Vec<u8>> {
    let total = AtomicUsize::new(0);
    let total_lazy = AtomicUsize::new(0);

    match self.menu_item {
      Some(item) => {
        let language = self.app.state::<Language>();
        update
          .download(
            |bytes, len| {
              total.fetch_add(bytes, Ordering::Relaxed);
              let total = total.load(Ordering::Relaxed);
              let delta = total - total_lazy.load(Ordering::Relaxed);

              if delta <= 1024 * 10 {
                return;
              }

              total_lazy.fetch_add(delta, Ordering::Relaxed);

              item
                .set_text(format!(
                  "{} {:.2}mb/{:.2}mb",
                  language.translate(Translation::UpdateDownloading),
                  total as f32 / 1024f32.powf(2.0),
                  len.unwrap_or_default() as f32 / 1024f32.powf(2.0)
                ))
                .unwrap();
            },
            || item.set_text(language.translate(Translation::CheckUpdate)).unwrap(),
          )
          .await
      }
      None => update.download(|_, _| {}, || {}).await,
    }
  }

  fn install(&self, update: &Update, bytes: Vec<u8>) -> updater::Result<()> {
    update.install(bytes)?;
    restart(&self.app.env());
    Ok(())
  }
}

fn compare_versions(version: Version, release: Version) -> bool {
  let pre = Prerelease::new(version.pre.split_once('.').unwrap_or_default().1).unwrap();
  release.cmp(&Version { pre, ..version }).is_gt()
}

#[cfg(test)]
mod tests {
  use semver::Version;

  use crate::platform::desktop::updater::compare_versions;

  #[rstest]
  #[case("2023.9.4-mac-silicon.8", "2023.9.4-8")]
  #[case("2023.9.4-windows.15", "2023.9.4-15")]
  #[case("2043.9.5-mac-intel.8", "2043.9.5-8")]
  fn same_version(#[case] left: Version, #[case] right: Version) {
    assert!(!compare_versions(left, right));
  }

  #[rstest]
  #[case("2023.9.4-mac-silicon.100", "2023.9.4-8")]
  #[case("2023.9.6-windows.15", "2023.9.4-15")]
  #[case("2063.9.5-mac-intel.8", "2043.9.5-8")]
  fn greater_version(#[case] left: Version, #[case] right: Version) {
    assert!(!compare_versions(left, right))
  }

  #[rstest]
  #[case("2023.9.4-mac-silicon.7", "2023.9.4-8")]
  #[case("2023.7.4-windows.15", "2023.9.4-15")]
  #[case("2003.9.5-mac-intel.8", "2043.9.5-8")]
  fn older_version(#[case] left: Version, #[case] right: Version) {
    assert!(compare_versions(left, right));
  }
}
