#![allow(dead_code)]

use gramaxfs::commands as fs;
use std::path::{Path, PathBuf};

use tauri::command;

use gramaxfs::error::Result;
use gramaxfs::FileInfo;

#[command]
pub(crate) fn read_dir(path: &Path) -> Result<Vec<String>> {
  fs::read_dir(path)
}

#[command]
pub(crate) fn read_file(path: &Path) -> Result<Vec<u8>> {
  fs::read_file(path)
}

#[command]
pub(crate) fn write_file(path: &Path, content: Vec<u8>) -> Result<()> {
  fs::write_file(path, content)
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
