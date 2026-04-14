#![allow(dead_code)]

use gramaxfs::commands as fs;
use gramaxfs::compress::CompressOptions;
use gramaxfs::DirStat;
use std::path::{Path, PathBuf};

use tauri::command;
use tauri_otel_context::OtelContext;

use gramaxfs::error::Result;
use gramaxfs::FileInfo;

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(untagged)]
pub enum WriteContent {
	Bytes(Vec<u8>),
	String(String),
}

#[command(async)]
pub fn write_file(_otel: OtelContext, path: &Path, content: WriteContent, compress: Option<CompressOptions>) -> Result<()> {
	match content {
		WriteContent::Bytes(bytes) => fs::write_file(path, bytes, compress),
		WriteContent::String(string) => fs::write_file(path, string, compress),
	}
}

#[command]
pub(crate) fn read_dir(_otel: OtelContext, path: &Path) -> Result<Vec<String>> {
	fs::read_dir(path)
}

#[command]
pub(crate) fn read_link(_otel: OtelContext, path: &Path) -> Result<PathBuf> {
	fs::read_link(path)
}

#[command]
pub(crate) fn make_dir(_otel: OtelContext, path: &Path, recursive: bool) -> Result<()> {
	fs::make_dir(path, recursive)
}

#[command]
pub(crate) fn remove_dir(_otel: OtelContext, path: &Path, recursive: bool) -> Result<()> {
	fs::remove_dir(path, recursive)
}

#[command]
pub(crate) fn make_symlink(_otel: OtelContext, from: &Path, to: &Path) -> Result<()> {
	fs::make_symlink(from, to)
}

#[command]
pub(crate) fn getstat(_otel: OtelContext, path: &Path, follow_link: bool) -> Result<FileInfo> {
	fs::getstat(path, follow_link)
}

#[command]
pub(crate) fn rmfile(_otel: OtelContext, path: &Path) -> Result<()> {
	fs::rmfile(path)
}

#[command]
pub(crate) fn exists(_otel: OtelContext, path: &Path) -> Result<bool> {
	fs::exists(path)
}

#[command]
pub(crate) fn copy(_otel: OtelContext, from: &Path, to: &Path) -> Result<()> {
	fs::copy(from, to)
}

#[command]
pub(crate) fn mv(_otel: OtelContext, from: &Path, to: &Path) -> Result<()> {
	fs::mv(from, to)
}

#[command]
pub(crate) fn read_dir_stats(_otel: OtelContext, path: &Path) -> Result<Vec<DirStat>> {
	fs::read_dir_stats(path)
}
