#![allow(dead_code)]

use std::fs;
use std::path::{Path, PathBuf};

use tauri::command;

use crate::error::Result;
use crate::FileInfo;

#[command]
pub(crate) fn read_dir(path: &Path) -> Result<Vec<String>> {
  fs::read_dir(path)?.map(|entry| Ok(entry?.file_name().to_string_lossy().into_owned())).collect()
}

#[command]
pub(crate) fn read_file(path: &Path) -> Result<Vec<u8>> {
  Ok(fs::read(path)?)
}

#[command]
pub(crate) fn write_file(path: &Path, content: Vec<u8>) -> Result<()> {
  Ok(fs::write(path, content)?)
}

#[command]
pub(crate) fn read_link(path: &Path) -> Result<PathBuf> {
  Ok(fs::read_link(path)?)
}

#[command]
pub(crate) fn make_dir(path: &Path, recursive: bool) -> Result<()> {
  let res = match recursive {
    true => fs::create_dir_all(path),
    false => fs::create_dir(path),
  };

  Ok(res?)
}

#[command]
pub(crate) fn remove_dir(path: &Path, recursive: bool) -> Result<()> {
  let res = match recursive {
    true => fs::remove_dir_all(path),
    false => fs::remove_dir(path),
  };

  Ok(res?)
}

#[command]
pub(crate) fn rename(from: &Path, to: &Path) -> Result<()> {
  Ok(fs::rename(from, to)?)
}

#[command]
pub(crate) fn make_symlink(from: &Path, to: &Path) -> Result<()> {
  Ok(fs::hard_link(from, to)?)
}

#[command]
pub(crate) fn stat(path: &Path, follow_link: bool) -> Result<FileInfo> {
  let meta = fs::metadata(path)?;
  if meta.is_symlink() && follow_link {
    return stat(&read_link(path)?, follow_link);
  }

  FileInfo::new(meta)
}

#[command]
pub(crate) fn unlink(path: &Path) -> Result<()> {
  Ok(fs::remove_file(path)?)
}

#[command]
pub(crate) fn exists(path: &Path) -> Result<bool> {
  Ok(path.exists())
}

#[command]
pub(crate) fn copy(from: &Path, to: &Path) -> Result<()> {
  if fs::metadata(from)?.is_dir() {
    return Ok(copy_dir::copy_dir(from, to)?.into_iter().next().map(Err).unwrap_or(Ok(()))?);
  }

  fs::copy(from, to)?;
  Ok(())
}

#[command]
pub(crate) fn mv(from: &Path, to: &Path) -> Result<()> {
  if let Some(parent) = to.parent() {
    fs::create_dir_all(parent)?;
  }

  fs::rename(from, to)?;
  Ok(())
}
