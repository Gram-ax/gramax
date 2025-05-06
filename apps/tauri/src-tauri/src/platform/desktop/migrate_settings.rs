use anyhow::Context;
use std::sync::Once;
use tauri::*;

const TAG: &str = "migrate-settings";
const OLD_ID: &str = "com.ics.gramax";

pub fn try_migrate_settings<R: Runtime, M: Manager<R>>(manager: &M) {
  static ONCE: Once = Once::new();

  #[cfg(any(target_os = "macos", target_os = "windows"))]
  ONCE.call_once(|| {
    let migrate = || -> anyhow::Result<()> {
      assert_ne!(OLD_ID, manager.config().identifier, "old id should not be the same as the new id");
      copy_settings(manager)?;
      Ok(())
    };

    let Err(err) = migrate() else {
      return;
    };

    error!(target: TAG, "failed to migrate settings: {}", err);
  });
}

fn copy_settings<R: Runtime, M: Manager<R>>(manager: &M) -> anyhow::Result<()> {
  let data_dir = manager.path().app_data_dir().context("data dir not found")?;
  let old_data_dir = data_dir.with_file_name(OLD_ID);

  if !old_data_dir.exists() {
    info!(target: TAG, "old data dir ({}) does not exists; skip", old_data_dir.display());
    return Ok(());
  }

  if data_dir.exists()
    && std::fs::read_dir(&data_dir)?.any(|entry| entry.is_ok_and(|entry| entry.file_name() == ".migrate"))
  {
    info!(target: TAG, "new data dir ({}) already exists; skip", data_dir.display());
    return Ok(());
  }

  if data_dir.exists() {
    std::fs::remove_dir_all(&data_dir)?;
  }

  copy_dir::copy_dir(&old_data_dir, &data_dir)?;
  std::fs::write(data_dir.join(".migrate"), "")?;
  _ = std::fs::remove_file(data_dir.join(".migrated"));

  Ok(())
}
