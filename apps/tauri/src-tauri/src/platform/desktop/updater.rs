use std::time::Duration;

use process::restart;
use tauri::menu::MenuItem;
use tauri::Result;
use tauri::*;
use tauri_plugin_updater::*;

use tauri_plugin_dialog::DialogExt;
use tauri_plugin_dialog::MessageDialogKind;
use tauri_plugin_updater as updater;

use semver::Prerelease;
use semver::Version;

use crate::AppHandleExt;

use super::menu::search_menu;
use super::menu::MenuItemId;

pub trait UpdaterBuilder<R: Runtime> {
  fn setup_updater(&self) -> updater::Result<()>;
}

impl<R: Runtime> UpdaterBuilder<R> for tauri::App<R> {
  fn setup_updater(&self) -> updater::Result<()> {
    let updater = Updater::new(self.app_handle().clone())?;
    self.manage(updater);
    Updater::start_background_check(self.app_handle().clone(), Duration::from_secs(3600 * 6));
    Ok(())
  }
}

pub struct Updater<R: Runtime> {
  app: AppHandle<R>,
  inner: updater::Updater,
}

#[derive(Default)]
enum UpdateCheckMode {
  #[default]
  Ask,
  Quiet,
}

impl<R: Runtime> Updater<R> {
  pub fn new(app: AppHandle<R>) -> updater::Result<Self> {
    let updater = app.updater_builder().version_comparator(|v, r| is_version_newer(v, r.version)).build()?;
    Ok(Self { app, inner: updater })
  }

  pub async fn check_and_ask(&self) -> Result<()> {
    let Some(menu_item) = self.get_menu_item() else {
      return Ok(());
    };
    if !menu_item.is_enabled()? {
      warn!("update checking is disabled");
      return Ok(());
    }

    let installer = UpdateInstaller::new(&self.app, Some(&menu_item));

    self.set_menu_enabled(Some(&menu_item), false)?;

    if let Err(err) = self.check(installer, UpdateCheckMode::Ask).await {
      self
        .app
        .dialog()
        .message(format!("{}\n\n{}\n\nError: {:?}", t!("etc.try-later"), err, err))
        .kind(MessageDialogKind::Error)
        .title(t!("updates.error-occured"))
        .blocking_show();
    }

    self.set_menu_enabled(Some(&menu_item), true)?;

    Ok(())
  }

  pub async fn check_quiet_and_ask(&self) -> updater::Result<()> {
    info!("check for updates quiet");
    let menu_item = self.get_menu_item();
    let installer = UpdateInstaller::new(&self.app, menu_item.as_ref());

    _ = self.set_menu_enabled(menu_item.as_ref(), false);
    let res = self.check(installer, UpdateCheckMode::Quiet).await;
    _ = self.set_menu_enabled(menu_item.as_ref(), true);
    res
  }

  fn ask(&self) -> bool {
    self
      .app
      .dialog()
      .message(t!("updates.new-version.body"))
      .title(t!("updates.new-version.title"))
      .ok_button_label(t!("updates.update-now"))
      .cancel_button_label(t!("etc.later"))
      .blocking_show()
  }

  fn start_background_check(app: AppHandle<R>, interval: Duration) {
    async_runtime::spawn(async move {
      let mut interval = tokio::time::interval(interval);
      let updater = app.state::<Updater<R>>();
      loop {
        interval.tick().await;
        if let Err(err) = updater.check_quiet_and_ask().await {
          warn!("An error occurred while checking for updates: {:?}", err);
        }
      }
    });
  }

  async fn check(&self, installer: UpdateInstaller<'_, R>, mode: UpdateCheckMode) -> updater::Result<()> {
    match (self.inner.check().await?, mode) {
      (Some(update), UpdateCheckMode::Quiet) => {
        let bytes = installer.download(&update).await?;
        if self.ask() {
          if let Some(update) = self.check_for_newer_update(&update).await? {
            let bytes = installer.download(&update).await?;
            installer.install(&update, bytes)?;
          } else {
            installer.install(&update, bytes)?;
          }
        }
        Ok(())
      }
      (Some(update), UpdateCheckMode::Ask) => {
        if self.ask() {
          installer.install(&update, installer.download(&update).await?)?
        }
        Ok(())
      }
      (_, UpdateCheckMode::Ask) => {
        self
          .app
          .dialog()
          .message(t!("updates.you-have-actual-ver.body"))
          .title(t!("updates.you-have-actual-ver.title"))
          .ok_button_label(t!("etc.ok"))
          .blocking_show();
        Ok(())
      }
      _ => Ok(()),
    }
  }

  async fn check_for_newer_update(&self, prev_update: &Update) -> updater::Result<Option<Update>> {
    let update = self.inner.check().await?;
    if let Some(update) = update {
      if !is_version_newer(Version::parse(&prev_update.version)?, Version::parse(&update.version)?) {
        return Ok(None);
      };

      self
        .app
        .dialog()
        .message(t!("updates.newer-update-found"))
        .title(t!("updates.new-version.title"))
        .ok_button_label(t!("updates.update-now"))
        .cancel_button_label(t!("etc.later"))
        .blocking_show();
      return Ok(Some(update));
    }

    Ok(None)
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

#[derive(Default)]
struct ChunkedProgress {
  downloaded: usize,
  delta: usize,
}

impl ChunkedProgress {
  fn on_chunk<F: Fn(usize, usize)>(&mut self, bytes: usize, total: Option<u64>, display: F) {
    self.downloaded += bytes;
    self.delta += bytes;

    if self.delta < 1024 * 128 {
      return;
    }

    self.delta = 0;
    display(self.downloaded, total.unwrap_or(self.downloaded as u64) as usize);
  }
}

struct UpdateInstaller<'u, R: Runtime> {
  app: &'u AppHandle<R>,
  menu_item: Option<&'u MenuItem<R>>,
}

impl<'u, R: Runtime> UpdateInstaller<'u, R> {
  fn new(app: &'u AppHandle<R>, menu_item: Option<&'u MenuItem<R>>) -> Self {
    Self { app, menu_item }
  }

  async fn download(&self, update: &Update) -> updater::Result<Vec<u8>> {
    match self.menu_item {
      Some(item) => {
        let on_chunk = |downloaded, total| {
          item
            .set_text(format!(
              "{} {:.2}mb/{:.2}mb",
              t!("updates.download-in-progress"),
              downloaded as f32 / 1024f32.powf(2.0),
              total as f32 / 1024f32.powf(2.0)
            ))
            .unwrap();
        };
        let mut progress = ChunkedProgress::default();

        update
          .download(
            |bytes, len| progress.on_chunk(bytes, len, on_chunk),
            || item.set_text(t!("updates.check")).unwrap(),
          )
          .await
      }
      None => update.download(|_, _| {}, || {}).await,
    }
  }

  fn install(&self, update: &Update, bytes: Vec<u8>) -> updater::Result<()> {
    super::config::dump_opened_windows(self.app)?;
    update.install(bytes)?;
    restart(&self.app.env());
  }
}

fn is_version_newer(prev: Version, version: Version) -> bool {
  let pre = Prerelease::new(prev.pre.split_once('.').unwrap_or_default().1).unwrap();
  version.cmp(&Version { pre, ..prev }).is_gt()
}

#[cfg(test)]
mod tests {
  use semver::Version;

  use crate::platform::desktop::updater::is_version_newer;

  #[rstest]
  #[case("2023.9.4-mac-silicon.8", "2023.9.4-8")]
  #[case("2023.9.4-windows.15", "2023.9.4-15")]
  #[case("2043.9.5-mac-intel.8", "2043.9.5-8")]
  fn same_version(#[case] left: Version, #[case] right: Version) {
    assert!(!is_version_newer(left, right));
  }

  #[rstest]
  #[case("2023.9.4-mac-silicon.100", "2023.9.4-8")]
  #[case("2023.9.6-windows.15", "2023.9.4-15")]
  #[case("2063.9.5-mac-intel.8", "2043.9.5-8")]
  fn greater_version(#[case] left: Version, #[case] right: Version) {
    assert!(!is_version_newer(left, right))
  }

  #[rstest]
  #[case("2023.9.4-mac-silicon.7", "2023.9.4-8")]
  #[case("2023.7.4-windows.15", "2023.9.4-15")]
  #[case("2003.9.5-mac-intel.8", "2043.9.5-8")]
  fn older_version(#[case] left: Version, #[case] right: Version) {
    assert!(is_version_newer(left, right));
  }
}
