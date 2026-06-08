#![allow(dead_code)]

use std::path::{Path, PathBuf};

use gramaxcore::commands as core;
use gramaxcore::scan::workspace::ScanOpts;
use gramaxcore::scan::workspace::WorkspaceEntryDto;
use gramaxcore::Result as CoreResult;
use gramaxfs::commands as fs;
use gramaxfs::commands::FsScope;
use gramaxfs::DirStat;

use tauri::command;
use tauri_otel_context::OtelContext;

use gramaxfs::error::Result;
use gramaxfs::FileInfo;

#[command]
pub(crate) fn read_dir(_otel: OtelContext, scope: FsScope, path: &Path) -> Result<Vec<String>> {
	fs::read_dir_names(scope, path)
}

#[command]
pub(crate) fn read_link(_otel: OtelContext, scope: FsScope, path: &Path) -> Result<PathBuf> {
	fs::read_link(scope, path)
}

#[command]
pub(crate) fn make_dir(_otel: OtelContext, scope: FsScope, path: &Path, recursive: bool) -> Result<()> {
	fs::make_dir(scope, path, recursive)
}

#[command]
pub(crate) fn remove_dir(_otel: OtelContext, scope: FsScope, path: &Path, recursive: bool) -> Result<()> {
	fs::remove_dir(scope, path, recursive)
}

#[command]
pub(crate) fn hardlink(_otel: OtelContext, scope: FsScope, from: &Path, to: &Path) -> Result<()> {
	fs::hardlink(scope, from, to)
}

#[command]
pub(crate) fn getstat(_otel: OtelContext, scope: FsScope, path: &Path, follow_link: bool) -> Result<FileInfo> {
	fs::stat(scope, path, follow_link)
}

#[command]
pub(crate) fn rmfile(_otel: OtelContext, scope: FsScope, path: &Path) -> Result<()> {
	fs::rmfile(scope, path)
}

#[command]
pub(crate) fn exists(_otel: OtelContext, scope: FsScope, path: &Path) -> Result<bool> {
	fs::exists(scope, path)
}

#[command]
pub(crate) fn copy(_otel: OtelContext, scope: FsScope, from: &Path, to: &Path) -> Result<()> {
	fs::copy(scope, from, to)
}

#[command]
pub(crate) fn mv(_otel: OtelContext, scope: FsScope, from: &Path, to: &Path) -> Result<()> {
	fs::mv(scope, from, to)
}

#[command]
pub(crate) fn read_dir_stats(_otel: OtelContext, scope: FsScope, path: &Path) -> Result<Vec<DirStat>> {
	fs::read_dir_stats(scope, path)
}

#[command(async)]
pub(crate) fn delete_empty_dirs(_otel: OtelContext, scope: FsScope, path: &Path) -> Result<()> {
	fs::delete_empty_dirs(scope, path)
}

#[command(async)]
pub(crate) fn scan_workspace(_otel: OtelContext, scope: FsScope, path: &Path, opts: ScanOpts) -> CoreResult<Vec<WorkspaceEntryDto>> {
	core::scan_workspace(scope, path, &opts)
}
