#![allow(dead_code)]

use gramaxfs::commands as fs;
use gramaxfs::DirStat;
use std::path::{Path, PathBuf};

use tauri::command;

use gramaxfs::error::Result;
use gramaxfs::FileInfo;

#[command]
pub(crate) fn read_dir(path: &Path) -> Result<Vec<String>> {
  fs::read_dir(path)
}

#[command]
pub(crate) fn read_link(path: &Path) -> Result<PathBuf> {
  fs::read_link(path)
}

#[command]
pub(crate) fn make_dir(path: &Path, recursive: bool) -> Result<()> {
  fs::make_dir(path, recursive)
}

#[command]
pub(crate) fn remove_dir(path: &Path, recursive: bool) -> Result<()> {
  fs::remove_dir(path, recursive)
}

#[command]
pub(crate) fn make_symlink(from: &Path, to: &Path) -> Result<()> {
  fs::make_symlink(from, to)
}

#[command]
pub(crate) fn getstat(path: &Path, follow_link: bool) -> Result<FileInfo> {
  fs::getstat(path, follow_link)
}

#[command]
pub(crate) fn rmfile(path: &Path) -> Result<()> {
  fs::rmfile(path)
}

#[command]
pub(crate) fn exists(path: &Path) -> Result<bool> {
  fs::exists(path)
}

#[command]
pub(crate) fn copy(from: &Path, to: &Path) -> Result<()> {
  fs::copy(from, to)
}

#[command]
pub(crate) fn mv(from: &Path, to: &Path) -> Result<()> {
  fs::mv(from, to)
}

#[command]
pub(crate) fn read_dir_stats(path: &Path) -> Result<Vec<DirStat>> {
  fs::read_dir_stats(path)
}
