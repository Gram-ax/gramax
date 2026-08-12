use std::path::PathBuf;

use napi::bindgen_prelude::Buffer;

use gramaxcore::commands as core;
use gramaxcore::scan::catalog::CatalogTreeDto;
use gramaxcore::scan::workspace::ScanOpts;
use gramaxcore::scan::workspace::WorkspaceEntryDto;
use gramaxcore::Error as CoreError;
use gramaxfs::commands as fs;
use gramaxfs::commands::FsScope;
use gramaxfs::compress::CompressOptions;
use gramaxfs::error::IoError;
use gramaxfs::DirStat;
use gramaxfs::FileInfo;

use napi_async_macro::napi_async;

fn parse_scope(scope: &str) -> Result<FsScope, IoError> {
	serde_json::from_str::<FsScope>(scope).map_err(|e| IoError::other(e.to_string()))
}

#[napi_async]
pub fn exists(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::exists(s, path.as_ref())) as Result<bool, IoError>
}

#[napi_async]
pub fn getstat(scope: String, path: String, follow_link: bool) -> Output {
	parse_scope(&scope).and_then(|s| fs::stat(s, path.as_ref(), follow_link)) as Result<FileInfo, IoError>
}

#[napi_async]
pub fn read_dir(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::read_dir_names(s, path.as_ref())) as Result<Vec<String>, IoError>
}

#[napi_async]
pub fn read_dir_stats(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::read_dir_stats(s, path.as_ref())) as Result<Vec<DirStat>, IoError>
}

#[napi_async]
pub fn read_link(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::read_link(s, path.as_ref())) as Result<PathBuf, IoError>
}

#[napi_async]
pub fn make_dir(scope: String, path: String, recursive: bool) -> Output {
	parse_scope(&scope).and_then(|s| fs::make_dir(s, path.as_ref(), recursive)) as Result<(), IoError>
}

#[napi_async]
pub fn remove_dir(scope: String, path: String, recursive: bool) -> Output {
	parse_scope(&scope).and_then(|s| fs::remove_dir(s, path.as_ref(), recursive)) as Result<(), IoError>
}

#[napi_async]
pub fn rmfile(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::rmfile(s, path.as_ref())) as Result<(), IoError>
}

#[napi_async]
pub fn hardlink(scope: String, from: String, to: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::hardlink(s, from.as_ref(), to.as_ref())) as Result<(), IoError>
}

#[napi_async]
pub fn copy(scope: String, from: String, to: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::copy(s, from.as_ref(), to.as_ref())) as Result<(), IoError>
}

#[napi_async]
pub fn mv(scope: String, from: String, to: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::mv(s, from.as_ref(), to.as_ref())) as Result<(), IoError>
}

#[napi_async]
pub fn delete_empty_dirs(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::delete_empty_dirs(s, path.as_ref())) as Result<(), IoError>
}

#[napi_async]
pub fn write_file(scope: String, path: String, content: Buffer, compress: Option<String>) -> Output {
	let compress = compress.as_deref().and_then(|s| serde_json::from_str::<CompressOptions>(s).ok());
	parse_scope(&scope).and_then(|s| fs::write(s, path.as_ref(), &content, compress)) as Result<(), IoError>
}

#[napi_async(buffer)]
pub fn read_file(scope: String, path: String) -> Output {
	parse_scope(&scope).and_then(|s| fs::read(s, path.as_ref())) as Result<Vec<u8>, IoError>
}

#[napi_async]
pub fn scan_workspace(scope: String, path: String, opts: String) -> Output {
	let parsed_opts = serde_json::from_str::<ScanOpts>(&opts).map_err(|e| CoreError::Other(e.to_string()));
	let scope_parsed = parse_scope(&scope).map_err(CoreError::from);
	scope_parsed.and_then(|s| parsed_opts.and_then(|o| core::scan_workspace(s, path.as_ref(), &o))) as Result<Vec<WorkspaceEntryDto>, CoreError>
}

#[napi_async]
pub fn scan_catalog(scope: String, path: String, docroot_rel: Option<String>, opts: String) -> Output {
	let parsed_opts = serde_json::from_str::<ScanOpts>(&opts).map_err(|e| CoreError::Other(e.to_string()));
	let scope_parsed = parse_scope(&scope).map_err(CoreError::from);
	let docroot = docroot_rel.map(PathBuf::from);
	scope_parsed.and_then(|s| parsed_opts.and_then(|o| core::scan_catalog(s, path.as_ref(), docroot.as_deref(), &o))) as Result<CatalogTreeDto, CoreError>
}

// FS watcher is desktop-only. Next provides noop bindings so JS resolver does not crash.
#[napi_async]
pub fn watch_workspace(_scope: String, _root: String, _opts: String) -> Output {
	Ok(0u32) as Result<u32, CoreError>
}

#[napi_async]
pub fn unwatch_workspace(_id: u32) -> Output {
	Ok(()) as Result<(), CoreError>
}
