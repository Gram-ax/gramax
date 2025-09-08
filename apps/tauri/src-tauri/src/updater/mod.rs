#![cfg(desktop)]

mod download;
mod metrics;

pub mod legacy;

use std::error::Error;

use tauri::process::restart;
use tauri::*;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_updater as inner;
use tokio::sync::Mutex;

use crate::platform::save_windows::SaveWindowsExt as _;
use crate::updater::download::UpdateCache;
use crate::updater::metrics::SettingsExt;

const TAG: &str = "updater";

pub trait UpdaterExt<R: Runtime> {
  fn updater_init(&self) -> inner::Result<()>;
  fn updater(&self) -> State<'_, Updater<R>>;
}

pub struct Updater<R: Runtime> {
  app: AppHandle<R>,
  inner: inner::Updater,
  cache: UpdateCache<R>,

  ready_update: Mutex<Option<(Vec<u8>, inner::Update)>>,
}

impl<R: Runtime> Updater<R> {
  pub fn new(app: AppHandle<R>) -> inner::Result<Self> {
    use tauri_plugin_updater::UpdaterExt;

    let updater = app.updater_builder().version_comparator(|v, r| Self::is_version_newer(v, r.version));

    let updater = if let Some(id) = app.get_metric_id()? {
      let metrics = metrics::Metric::new(app.clone(), id.0);
      updater.headers(metrics.as_headers())
    } else {
      updater
    };

    Ok(Self {
      app: app.clone(),
      inner: updater.build()?,
      cache: UpdateCache::new(app.clone()),
      ready_update: Mutex::new(None),
    })
  }

  pub async fn check(&self) -> inner::Result<()> {
    let Ok(mut update_bytes) = self.ready_update.try_lock() else {
      info!(target: TAG, "update already in progress - tried to lock already locked `update_bytes` mutex; skip check");
      return Ok(());
    };

    if let Some((_, update)) = update_bytes.as_ref() {
      info!(target: TAG, "update found in memory cache: {} -> {}", update.current_version, update.version);
      self.app.emit("update:ready", ())?;
      return Ok(());
    }

    let Some(update) = self.inner.check().await? else {
      info!(target: TAG, "no updates found");
      return Ok(());
    };

    info!(target: TAG, "update fetched: {} -> {}", update.current_version, update.version);
    update_bytes.replace((self.cache.prepare_to_install(&update).await?, update));

    self.app.emit("update:ready", ())?;
    Ok(())
  }

  pub fn install(&self) -> inner::Result<()> {
    match self.ready_update.try_lock().map(|mut update_bytes| update_bytes.take()) {
      Ok(Some((bytes, update))) => {
        self.install_inner(update, bytes)?;
      }
      Ok(None) => {
        info!(target: TAG, "no update to install");
      }
      Err(_) => {
        info!(target: TAG, "update already in progress - tried to lock already locked `update_bytes` mutex; skip install");
      }
    }

    Ok(())
  }

  pub fn install_bytes(&self, bytes: Vec<u8>) -> inner::Result<()> {
    let release = inner::RemoteRelease {
      version: semver::Version::new(0, 0, 0),
      notes: None,
      pub_date: None,
      data: inner::RemoteReleaseInner::Dynamic(inner::ReleaseManifestPlatform {
        url: Url::parse("gramax://dummy-update").unwrap(),
        signature: "".into(),
      }),
    };

    let update = self.inner.update_from_release(release)?;
    self.install_inner(update, bytes)
  }

  fn install_inner(&self, update: inner::Update, bytes: Vec<u8>) -> inner::Result<()> {
    info!(target: TAG, "installing update: {} -> {}", update.current_version, update.version);

    self.app.save_windows()?;
    update.install(bytes)?;
    std::env::set_var("UPDATE_INSTALLED", update.version);
    restart(&self.app.env());
  }

  fn is_version_newer(prev: semver::Version, version: semver::Version) -> bool {
    let pre = semver::Prerelease::new(prev.pre.split_once('.').unwrap_or_default().1).unwrap();
    version.cmp(&semver::Version { pre, ..prev }).is_gt()
  }
}

#[command(async)]
pub fn restart_app<R: Runtime>(window: Window<R>) {
  window.app_handle().save_windows().unwrap();
  restart(&window.app_handle().env());
}

#[command(async)]
pub async fn update_check<R: Runtime>(app: AppHandle<R>) -> inner::Result<()> {
  app.updater().check().await.inspect_err(|e| _ = emit_error(app, e))
}

#[command(async)]
pub fn update_install<R: Runtime>(app: AppHandle<R>) -> inner::Result<()> {
  app.updater().install().inspect_err(|e| _ = emit_error(app, e))
}

#[command]
pub fn update_cache_clear<R: Runtime>(app: AppHandle<R>) -> inner::Result<()> {
  app.updater().cache.clear()
}

#[command(async)]
pub fn update_install_by_path<R: Runtime>(app: AppHandle<R>) -> inner::Result<()> {
  let Some(path) = app
    .dialog()
    .file()
    .add_filter("Gramax Update", &["*.tar.gz", "*.exe"])
    .blocking_pick_file()
    .map(|p| p.simplified().into_path().expect("invalid path"))
  else {
    info!(target: TAG, "no file selected");
    return Ok(());
  };

  info!(target: TAG, "selected file: {}", path.display());
  let bytes = std::fs::read(path)?;
  app.updater().install_bytes(bytes)?;
  Ok(())
}

impl<R: Runtime> UpdaterExt<R> for AppHandle<R> {
  fn updater_init(&self) -> inner::Result<()> {
    let updater = Updater::new(self.clone())?;
    self.manage(updater);
    Ok(())
  }

  fn updater(&self) -> State<'_, Updater<R>> {
    self.state::<Updater<R>>()
  }
}

fn emit_error<R: Runtime>(app: AppHandle<R>, e: &inner::Error) -> inner::Result<()> {
  use inner::Error as E;

  let message = match e {
    E::Reqwest(e) => {
      if e.is_connect() {
        #[cfg(not(debug_assertions))]
        error!(target: TAG, "failed to connect to the updater server: {:#?}", e);
        return Ok(());
      }

      let error_detail = e.to_string();

      let mut final_source = e.source();

      while let Some(source) = final_source {
        if let Some(e) = source.source() {
          final_source = Some(e);
        } else {
          break;
        }
      }

      format!("{}{}", error_detail, final_source.map(|e| format!("; {e}")).unwrap_or_default())
    }
    _ => e.to_string(),
  };

  app.emit("update:error", capitalize_first_letter(&message).replace('`', ""))?;
  Ok(())
}

fn capitalize_first_letter(s: &str) -> String {
  let mut chars = s.chars();
  let Some(first) = chars.next() else {
    return String::with_capacity(0);
  };
  first.to_uppercase().chain(chars).collect()
}
