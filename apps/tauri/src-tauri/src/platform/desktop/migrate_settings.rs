#![cfg_attr(target_os = "linux", allow(unused))]

use std::path::Path;
use std::sync::Once;

use anyhow::bail;
use anyhow::Context;
use tauri::*;

const TAG: &str = "migrate-settings";
const OLD_ID: &str = "com.ics.gramax";

pub fn try_migrate_settings<R: Runtime, M: Manager<R>>(manager: &M) {
  static ONCE: Once = Once::new();

  #[cfg(any(target_os = "macos", target_os = "windows"))]
  ONCE.call_once(|| {
    let migrate = || -> anyhow::Result<()> {
      // #[cfg(target_os = "macos")]
      // migrate_webkit_dir(manager)?;
      // #[cfg(target_os = "windows")]
      // migrate_edge_dir(manager)?;

      // copy_settings(manager)?;

      Ok(())
    };

    let Err(err) = migrate() else {
      return;
    };

    rfd::MessageDialog::new()
      .set_level(rfd::MessageLevel::Error)
      .set_title(t!("etc.error.title"))
      .set_description(err.to_string())
      .set_buttons(rfd::MessageButtons::OkCustom(t!("etc.ok").to_string()))
      .show();
  });
}

#[cfg(target_os = "macos")]
fn migrate_webkit_dir<R: Runtime, M: Manager<R>>(manager: &M) -> anyhow::Result<()> {
  let data_dir = manager.path().data_dir().context("data dir not found")?;

  let lib_dir = data_dir.parent().with_context(|| {
    format!("library dir not found (but expected to be parent of data_dir: {})", data_dir.display())
  })?;

  let webkit_dir = lib_dir.join("WebKit");

  copy_cache(manager, &webkit_dir)?;
  Ok(())
}

#[cfg(target_os = "windows")]
fn migrate_edge_dir<R: Runtime, M: Manager<R>>(manager: &M) -> anyhow::Result<()> {
  let cache_dir = manager.path().cache_dir().context("cache dir not found")?;
  copy_cache(manager, &cache_dir)?;
  Ok(())
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
fn copy_cache<R: Runtime, M: Manager<R>>(manager: &M, cache_dir: &Path) -> anyhow::Result<()> {
  if !cache_dir.exists() {
    bail!("webview cache dir not found at {}", cache_dir.display());
  }

  let old_webkit_dir = cache_dir.join(OLD_ID);
  let new_webkit_dir = cache_dir.join(&manager.config().identifier);

  if new_webkit_dir.exists()
    && std::fs::read_dir(&new_webkit_dir)?
      .any(|entry| entry.is_ok_and(|entry| entry.file_name() == ".migrated"))
  {
    info!(target: TAG, "webview cache dir ({}) already exists; skip", new_webkit_dir.display());
    return Ok(());
  }

  if !old_webkit_dir.exists() {
    info!(target: TAG, "webview cache dir does not exists ({}); skip", old_webkit_dir.display());
    return Ok(());
  }

  if new_webkit_dir.exists() {
    std::fs::remove_dir_all(&new_webkit_dir)?;
  }

  copy_dir::copy_dir(&old_webkit_dir, &new_webkit_dir)?;
  std::fs::write(new_webkit_dir.join(".migrated"), "")?;

  Ok(())
}

#[cfg(any(target_os = "macos", target_os = "windows"))]
fn copy_settings<R: Runtime, M: Manager<R>>(manager: &M) -> anyhow::Result<()> {
  let data_dir = manager.path().app_data_dir().context("data dir not found")?;
  let old_data_dir = data_dir.with_file_name(OLD_ID);

  if !old_data_dir.exists() {
    info!(target: TAG, "old data dir ({}) does not exists; skip", old_data_dir.display());
    return Ok(());
  }

  if data_dir.exists()
    && std::fs::read_dir(&data_dir)?.any(|entry| entry.is_ok_and(|entry| entry.file_name() == ".migrated"))
  {
    info!(target: TAG, "new data dir ({}) already exists; skip", data_dir.display());
    return Ok(());
  }

  if data_dir.exists() {
    std::fs::remove_dir_all(&data_dir)?;
  }

  copy_dir::copy_dir(&old_data_dir, &data_dir)?;
  std::fs::write(data_dir.join(".migrated"), "")?;

  Ok(())
}
