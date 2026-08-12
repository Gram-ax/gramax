#![allow(dead_code)]

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::sync::Mutex;
use std::sync::OnceLock;

use gramaxcore::commands as core;
use gramaxcore::scan::catalog::CatalogTreeDto;
use gramaxcore::scan::workspace::ScanOpts;
use gramaxcore::scan::workspace::WorkspaceEntryDto;
use gramaxcore::watch::FsEvent;
use gramaxcore::watch::WatchHandle;
use gramaxcore::watch::WatchOpts;
use gramaxcore::Result as CoreResult;
use gramaxfs::commands as fs;
use gramaxfs::commands::FsScope;
use gramaxfs::DirStat;

use serde::Serialize;
use tauri::command;
use tauri::Emitter;
use tauri::Runtime;
use tauri::Window;
use tauri_otel_context::OtelContext;

use gramaxfs::error::Result;
use gramaxfs::FileInfo;

static WATCHERS: OnceLock<Mutex<HashMap<u64, (PathBuf, WatchHandle)>>> = OnceLock::new();
static NEXT_WATCH_ID: AtomicU64 = AtomicU64::new(1);

fn watchers() -> &'static Mutex<HashMap<u64, (PathBuf, WatchHandle)>> {
	WATCHERS.get_or_init(|| Mutex::new(HashMap::new()))
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct FsEventPayload {
	id: u64,
	events: Vec<FsEvent>,
}

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

#[command(async)]
pub(crate) fn scan_catalog(
	_otel: OtelContext,
	scope: FsScope,
	path: &Path,
	docroot_rel: Option<PathBuf>,
	opts: ScanOpts,
) -> CoreResult<CatalogTreeDto> {
	core::scan_catalog(scope, path, docroot_rel.as_deref(), &opts)
}

#[command(async)]
pub(crate) fn watch_workspace<R: Runtime>(window: Window<R>, _otel: OtelContext, scope: FsScope, opts: Option<WatchOpts>) -> CoreResult<u64> {
	let FsScope::Disk { root } = &scope else {
		return Err(gramaxcore::Error::Other("unsupported scope; only disk is supported".to_string()));
	};

	let id = NEXT_WATCH_ID.fetch_add(1, Ordering::SeqCst);
	let key = root.canonicalize().unwrap_or_else(|_| root.to_path_buf());

	let handle = core::watch_workspace(scope, opts.unwrap_or_default(), move |events| {
		let _ = window.emit("fs-event", FsEventPayload { id, events });
	})?;

	let mut map = watchers().lock().unwrap();
	let stale: Vec<u64> = map.iter().filter(|(_, (p, _))| p == &key).map(|(k, _)| *k).collect();

	for old in stale {
		if let Some((_, h)) = map.remove(&old) {
			h.stop();
		}
	}

	map.insert(id, (key, handle));
	Ok(id)
}

#[command]
pub(crate) fn unwatch_workspace(_otel: OtelContext, id: u64) -> CoreResult<()> {
	if let Some((_, h)) = watchers().lock().unwrap().remove(&id) {
		h.stop();
	}

	Ok(())
}
