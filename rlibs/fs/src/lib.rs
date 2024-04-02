pub mod commands;
pub mod error;

use std::fs::Metadata;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

pub use error::Result;
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct FileInfo {
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
