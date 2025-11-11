#![cfg(desktop)]

mod download;
mod metrics;

pub mod error;
pub mod legacy;

use tauri::http::HeaderName;
use tauri::process::restart;
use tauri::*;
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_updater as inner;
use tokio::sync::Mutex;

use crate::platform::save_windows::SaveWindowsExt as _;
use crate::updater::download::UpdateCache;
use crate::updater::error::UpdaterError;
use crate::updater::metrics::SettingsExt;

const TAG: &str = "updater";

type Result<T> = std::result::Result<T, UpdaterError>;

pub trait UpdaterExt<R: Runtime> {
  fn updater_init(&self) -> Result<()>;
  fn updater(&self) -> State<'_, Updater<R>>;
}

pub struct Updater<R: Runtime> {
  app: AppHandle<R>,
  inner: Mutex<inner::Updater>,
  cache: UpdateCache<R>,

  ready_update: Mutex<Option<(Vec<u8>, inner::Update)>>,
}

impl<R: Runtime> Updater<R> {
  pub fn new(app: AppHandle<R>) -> Result<Self> {
    use tauri_plugin_updater::UpdaterExt;

    let updater = app.updater_builder().version_comparator(|v, r| Self::is_version_differs(v, r.version));

    let updater = if let Some(id) = app.get_metric_id()? {
      let metrics = metrics::Metric::new(app.clone(), id.0);
      updater.headers(metrics.as_headers())
    } else {
      updater
    };

    Ok(Self {
      app: app.clone(),
      inner: Mutex::new(updater.build()?),
      cache: UpdateCache::new(app.clone()),
      ready_update: Mutex::new(None),
    })
  }

  pub async fn check(&self) -> Result<()> {
    let Ok(mut update_bytes) = self.ready_update.try_lock() else {
      info!(target: TAG, "update already in progress - tried to lock already locked `update_bytes` mutex; skip check");
      return Ok(());
    };

    if let Some((_, update)) = update_bytes.as_ref() {
      info!(target: TAG, "update found in memory cache: {} -> {}", update.current_version, update.version);
      self.app.emit("update:ready", ())?;
      return Ok(());
    }

    self.try_setup_ges_version_header().await.map_err(|e| {
      warn!(target: TAG, "failed to check enterprise version: {}", e);
      UpdaterError::CheckEnterpriseVersion(Box::new(e))
    })?;

    let Some(update) = self.inner.lock().await.check().await? else {
      info!(target: TAG, "no updates found");
      return Ok(());
    };

    info!(target: TAG, "update fetched: {} -> {}", update.current_version, update.version);
    update_bytes.replace((self.cache.prepare_to_install(&update).await?, update));

    self.app.emit("update:ready", ())?;
    Ok(())
  }

  pub fn install(&self) -> Result<()> {
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

  pub async fn install_bytes(&self, bytes: Vec<u8>) -> Result<()> {
    let url = Url::parse("gramax://dummy-update").unwrap();
    let release = inner::RemoteRelease {
      version: semver::Version::new(0, 0, 0),
      notes: None,
      pub_date: None,
      data: inner::RemoteReleaseInner::Dynamic(inner::ReleaseManifestPlatform {
        url: url.clone(),
        signature: "".into(),
      }),
    };

    let update = self.inner.lock().await.update_from_release(&release, &url, "")?;
    self.install_inner(update, bytes)
  }

  fn install_inner(&self, update: inner::Update, bytes: Vec<u8>) -> Result<()> {
    info!(target: TAG, "installing update: {} -> {}", update.current_version, update.version);

    self.app.save_windows()?;
    update.install(bytes)?;
    std::env::set_var("UPDATE_INSTALLED", update.version);
    restart(&self.app.env());
  }

  async fn try_setup_ges_version_header(&self) -> Result<()> {
    let maybe_enterprise_version = resolve_enterprise_version(&self.app).await?;

    let mut updater = self.inner.lock().await;
    if let Some(version) = maybe_enterprise_version {
      updater.header(HeaderName::from_static("x-gx-desired-app-version"), version.to_string().parse()?);
    } else {
      updater.remove_header(HeaderName::from_static("x-gx-desired-app-version"));
    }

    Ok(())
  }

  fn is_version_differs(prev: semver::Version, version: semver::Version) -> bool {
    let pre = semver::Prerelease::new(prev.pre.split_once('.').unwrap_or_default().1).unwrap();
    version.cmp(&semver::Version { pre, ..prev }).is_ne()
  }
}

#[command(async)]
pub fn restart_app<R: Runtime>(window: Window<R>) {
  window.app_handle().save_windows().unwrap();
  restart(&window.app_handle().env());
}

#[command(async)]
pub async fn update_check<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  app.updater().check().await.inspect_err(|e| _ = emit_error(app, e))
}

#[command(async)]
pub fn update_install<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  app.updater().install().inspect_err(|e| _ = emit_error(app, e))
}

#[command(async)]
pub async fn update_reset_bytes<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  app.updater().ready_update.lock().await.take();
  Ok(())
}

#[command]
pub fn update_cache_clear<R: Runtime>(app: AppHandle<R>) -> Result<()> {
  app.updater().cache.clear().map_err(Into::into)
}

#[command(async)]
pub async fn update_install_by_path<R: Runtime>(app: AppHandle<R>) -> Result<()> {
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
  app.updater().install_bytes(bytes).await?;
  Ok(())
}

impl<R: Runtime> UpdaterExt<R> for AppHandle<R> {
  fn updater_init(&self) -> Result<()> {
    let updater = Updater::new(self.clone())?;
    self.manage(updater);
    Ok(())
  }

  fn updater(&self) -> State<'_, Updater<R>> {
    self.state::<Updater<R>>()
  }
}

fn emit_error<R: Runtime>(app: AppHandle<R>, e: &UpdaterError) -> Result<()> {
  if let UpdaterError::Reqwest(ref e) = e {
    if e.is_connect() {
      #[cfg(not(debug_assertions))]
      error!(target: TAG, "failed to connect to the updater server: {:#?}", e);
      return Ok(());
    }
  };

  app.emit("update:error", e)?;
  Ok(())
}

async fn resolve_enterprise_version<R: Runtime>(
  app: &AppHandle<R>,
) -> std::result::Result<Option<semver::Version>, UpdaterError> {
  #[derive(serde::Deserialize)]
  #[serde(rename_all = "camelCase")]
  struct Config {
    ges_url: Url,
  }

  let path = app.path().app_data_dir()?.join("config.yaml");

  if !path.exists() {
    return Ok(None);
  }

  let Ok(config) = serde_yml::from_str::<Config>(&std::fs::read_to_string(path)?)
    .inspect_err(|e| warn!(target: TAG, "failed to parse config: {}", e))
  else {
    return Ok(None);
  };

  let mut url = config.ges_url;
  url.path_segments_mut().unwrap().push("enterprise");

  let res = reqwest::Client::new().head(url).send().await?;

  let ver = res
    .headers()
    .get("x-ges-version")
    .and_then(|v| v.to_str().ok())
    .map(semver::Version::parse)
    .transpose()?;

  Ok(ver)
}
