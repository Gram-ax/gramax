use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::time::Duration;

use tauri::menu::MenuItem;
use tauri::*;
use tauri_plugin_updater::*;

use tauri::process::restart;

use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::MessageDialogKind;
use tauri_plugin_updater::Result;

use semver::Prerelease;
use semver::Version;

use crate::translation::*;

use super::menu::MenuHandle;

pub trait UpdaterBuilder<R: Runtime> {
  fn setup_updater(&self);
}

impl<R: Runtime> UpdaterBuilder<R> for tauri::App<R> {
  fn setup_updater(&self) {
    let mut updater = AppUpdater::new(self.app_handle().clone()).expect("unable to build updater");
    if let Some(menu) = self.try_state::<MenuHandle<R>>() {
      updater.setup(menu.update_item());
    }
    self.manage(updater);
  }
}

pub struct AppUpdater<R: Runtime> {
  app: AppHandle<R>,
  updater: Updater,
  language: Language,
  menu_item: Option<MenuItem<R>>,
}

impl<R: Runtime> AppUpdater<R> {
  pub fn new(app: AppHandle<R>) -> Result<Self> {
    let updater = app.updater_builder().version_comparator(|v, r| compare_versions(v, r.version)).build()?;
    let language = *app.state::<Language>().inner();
    Ok(Self { app, updater, language, menu_item: None })
  }

  pub fn setup(&mut self, item: MenuItem<R>) {
    self.menu_item = Some(item)
  }

  pub async fn check_and_ask(&self) -> Result<()> {
    if !matches!(self.menu_item.as_ref().map(|i| i.is_enabled()), Some(Ok(true))) {
      warn!("update checking is disabled");
      return Ok(());
    }

    self.set_menu_enabled(false).unwrap();

    if let Err(err) = self.check().await {
      self
        .app
        .dialog()
        .message(format!("{:?}\n{}", err, self.language.translate(Translation::TryLater)))
        .kind(MessageDialogKind::Error)
        .title(self.language.translate(Translation::ErrorWhileUpdating))
        .blocking_show();
    }

    self.set_menu_enabled(true).unwrap();

    Ok(())
  }

  pub async fn check_quiet_and_ask(&self) -> Result<()> {
    info!("check for updates quiet");

    self.set_menu_enabled(false).unwrap();
    let res = self.check_quiet().await;
    self.set_menu_enabled(true).unwrap();
    res
  }

  pub fn ask(&self) -> bool {
    self
      .app
      .dialog()
      .message(self.language.translate(Translation::UpdateNowBody))
      .title(self.language.translate(Translation::NewVersion))
      .ok_button_label(self.language.translate(Translation::UpdateNow))
      .cancel_button_label(self.language.translate(Translation::DeclineUpdate))
      .blocking_show()
  }

  fn install(&self, update: &Update, bytes: Vec<u8>) -> Result<()> {
    update.install(bytes)?;
    restart(&self.app.env());
    Ok(())
  }

  async fn check(&self) -> Result<()> {
    match self.updater.check().await? {
      Some(update) if self.ask() => self.install(&update, self.download(&update).await?),
      Some(_) => Ok(()),
      _ => {
        self
          .app
          .dialog()
          .message(self.language.translate(Translation::YouHaveActualVersionBody))
          .title(self.language.translate(Translation::YouHaveActualVersion))
          .ok_button_label(self.language.translate(Translation::UpdateOk))
          .blocking_show();
        Ok(())
      }
    }
  }

  async fn check_quiet(&self) -> Result<()> {
    if let Some(update) = self.updater.check().await? {
      let bytes = self.download(&update).await?;
      let should_install = self.ask();
      if should_install {
        self.install(&update, bytes)?;
      }
    }
    Ok(())
  }

  async fn download(&self, update: &Update) -> Result<Vec<u8>> {
    let total = AtomicUsize::new(0);
    let total_lazy = AtomicUsize::new(0);

    match self.menu_item {
      Some(ref item) => {
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

  fn set_menu_enabled(&self, enabled: bool) -> tauri::Result<()> {
    if let Some(item) = self.menu_item.as_ref() {
      item.set_enabled(enabled)?;
      if enabled {
        item.set_text(self.language.translate(Translation::CheckUpdate))?;
      } else {
        item.set_text(self.language.translate(Translation::CheckingForUpdate))?;
      };
    }

    Ok(())
  }
}

pub fn start_quiet_update_checking<R: Runtime>(app: AppHandle<R>, interval: Duration) {
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
