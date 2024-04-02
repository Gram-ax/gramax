use std::fs;
use std::path::Path;
use std::path::PathBuf;

use crate::error::Result;
use crate::FileInfo;

pub fn read_dir<P: AsRef<Path>>(path: P) -> Result<Vec<String>> {
  fs::read_dir(path)?.map(|entry| Ok(entry?.file_name().to_string_lossy().into_owned())).collect()
}

pub fn read_file<P: AsRef<Path>>(path: P) -> Result<Vec<u8>> {
  Ok(fs::read(path)?)
}

pub fn write_file<P: AsRef<Path>>(path: P, content: Vec<u8>) -> Result<()> {
  Ok(fs::write(path, content)?)
}

pub fn read_link<P: AsRef<Path>>(path: P) -> Result<PathBuf> {
  Ok(fs::read_link(path)?)
}

pub fn make_dir<P: AsRef<Path>>(path: P, recursive: bool) -> Result<()> {
  let res = match recursive {
    true => fs::create_dir_all(path),
    false => fs::create_dir(path),
  };

  Ok(res?)
}

pub fn remove_dir<P: AsRef<Path>>(path: P, recursive: bool) -> Result<()> {
  let res = match recursive {
    true => fs::remove_dir_all(path),
    false => fs::remove_dir(path),
  };

  Ok(res?)
}

pub fn make_symlink<P: AsRef<Path>>(from: P, to: P) -> Result<()> {
  Ok(fs::hard_link(from, to)?)
}

pub fn getstat<P: AsRef<Path>>(path: P, follow_link: bool) -> Result<FileInfo> {
  let meta = fs::metadata(&path)?;
  if meta.is_symlink() && follow_link {
    return getstat(read_link(path)?, follow_link);
  }

  FileInfo::new(meta)
}

pub fn rmfile<P: AsRef<Path>>(path: P) -> Result<()> {
  Ok(fs::remove_file(path)?)
}

pub fn exists<P: AsRef<Path>>(path: P) -> Result<bool> {
  Ok(path.as_ref().exists())
}

pub fn copy<P: AsRef<Path>>(from: P, to: P) -> Result<()> {
  if fs::metadata(&from)?.is_dir() {
    return Ok(copy_dir::copy_dir(from, to)?.into_iter().next().map(Err).unwrap_or(Ok(()))?);
  }

  fs::copy(from, to)?;
  Ok(())
}

pub fn mv<P: AsRef<Path>>(from: P, to: P) -> Result<()> {
  if let Some(parent) = to.as_ref().parent() {
    if !parent.exists() {
      fs::create_dir_all(parent)?;
    }
  }

  let Err(err) = fs::rename(&from, &to) else { return Ok(()) };

  // Resource is Busy (os error 10) or os error 29
  if let Some(10 | 29) = err.raw_os_error() {
    log::warn!(target: "gramax-fs::mv", "seems resource {} is busy; copying instead of renaming", &from.as_ref().display());

    copy(&from, &to)?;
    if fs::metadata(&from)?.is_dir() {
      fs::remove_dir_all(&from)?;
    } else {
      fs::remove_file(&from)?;
    }

    return Ok(());
  }

  Err(err.into())
}
