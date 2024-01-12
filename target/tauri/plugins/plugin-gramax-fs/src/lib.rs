use serde::Serialize;
use tauri::{
  plugin::{Builder, TauriPlugin},
  Runtime,
};

use std::{
  fs::Metadata,
  time::{SystemTime, UNIX_EPOCH},
};

mod commands;
mod error;

pub use error::Result;

#[derive(Serialize, Debug)]
struct FileInfo {
  #[serde(rename = "type")]
  file_kind: String,
  size: u64,
  #[serde(rename = "ctimeMs")]
  created: u128,
  #[serde(rename = "mtimeMs")]
  modified: u128,
}

impl FileInfo {
  pub fn new(meta: Metadata) -> Result<Self> {
    let kind = if meta.is_file() {
      "file"
    } else if meta.is_dir() {
      "dir"
    } else {
      "symbolic"
    };

    let info = FileInfo {
      file_kind: kind.into(),
      size: meta.len(),
      created: meta
        .created()
        .unwrap_or(SystemTime::now())
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis(),
      modified: meta.modified()?.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
    };

    Ok(info)
  }
}

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_gramaxfs);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  use commands::*;

  Builder::new("gramaxfs")
    .setup(|_app, _api| {
      #[cfg(target_os = "ios")]
      _api.register_ios_plugin(init_plugin_gramaxfs)?;

      #[cfg(target_os = "android")]
      _api.register_android_plugin("com.ics.gramax.fs", "GramaxFS")?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      read_dir,
      read_file,
      write_file,
      read_link,
      make_dir,
      remove_dir,
      unlink,
      rename,
      make_symlink,
      stat,
      exists,
      copy,
      mv
    ])
    .build()
}
