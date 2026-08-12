use std::path::PathBuf;

use gramaxcore::commands as core;

use gramaxcore::scan::catalog::CatalogTreeDto;
use gramaxcore::scan::workspace::ScanOpts;
use gramaxcore::scan::workspace::WorkspaceEntryDto;

use gramaxcore::Result as CoreResult;
use gramaxfs::commands as fs;
use gramaxfs::commands::FsScope;
use gramaxfs::compress::CompressOptions;
use gramaxfs::error::Result;
use gramaxfs::DirStat;
use gramaxfs::FileInfo;

use em_bindgen_macro::em_bindgen;

#[em_bindgen(json)]
pub fn read_dir(scope: FsScope, path: String) -> Result<Vec<String>> {
	fs::read_dir_names(scope, path.as_ref())
}

#[em_bindgen(bytes)]
pub fn read_file(scope: FsScope, path: String) -> Result<Vec<u8>> {
	fs::read(scope, path.as_ref())
}

#[em_bindgen]
pub fn write_file(scope: FsScope, path: String, content_ptr: usize, content_len: usize, compress: Option<CompressOptions>) -> Result<()> {
	let data = unsafe { std::slice::from_raw_parts(content_ptr as *const u8, content_len) };
	let res = fs::write(scope, path.as_ref(), data, compress);
	unsafe { crate::ffi::rfree(content_ptr as *mut _, content_len) };
	res
}

#[em_bindgen(json)]
pub fn read_link(scope: FsScope, path: String) -> Result<PathBuf> {
	fs::read_link(scope, path.as_ref())
}

#[em_bindgen]
pub fn make_dir(scope: FsScope, path: String, recursive: bool) -> Result<()> {
	fs::make_dir(scope, path.as_ref(), recursive)
}

#[em_bindgen]
pub fn remove_dir(scope: FsScope, path: String, recursive: bool) -> Result<()> {
	fs::remove_dir(scope, path.as_ref(), recursive)
}

#[em_bindgen]
pub fn hardlink(scope: FsScope, from: String, to: String) -> Result<()> {
	fs::hardlink(scope, from.as_ref(), to.as_ref())
}

#[em_bindgen(json)]
pub fn getstat(scope: FsScope, path: String, follow_link: bool) -> Result<FileInfo> {
	fs::stat(scope, path.as_ref(), follow_link)
}

#[em_bindgen(json)]
pub fn read_dir_stats(scope: FsScope, path: String) -> Result<Vec<DirStat>> {
	fs::read_dir_stats(scope, path.as_ref())
}

#[em_bindgen]
pub fn rmfile(scope: FsScope, path: String) -> Result<()> {
	fs::rmfile(scope, path.as_ref())
}

#[em_bindgen(json)]
pub fn exists(scope: FsScope, path: String) -> Result<bool> {
	fs::exists(scope, path.as_ref())
}

#[em_bindgen]
pub fn copy(scope: FsScope, from: String, to: String) -> Result<()> {
	fs::copy(scope, from.as_ref(), to.as_ref())
}

#[em_bindgen]
pub fn mv(scope: FsScope, from: String, to: String) -> Result<()> {
	fs::mv(scope, from.as_ref(), to.as_ref())
}

#[em_bindgen]
pub fn delete_empty_dirs(scope: FsScope, path: String) -> Result<()> {
	fs::delete_empty_dirs(scope, path.as_ref())
}

#[em_bindgen(json)]
pub fn scan_workspace(scope: FsScope, path: String, opts: ScanOpts) -> CoreResult<Vec<WorkspaceEntryDto>> {
	core::scan_workspace(scope, path.as_ref(), &opts)
}

#[em_bindgen(json)]
pub fn scan_catalog(scope: FsScope, path: String, docroot_rel: Option<String>, opts: ScanOpts) -> CoreResult<CatalogTreeDto> {
	let docroot = docroot_rel.map(PathBuf::from);
	core::scan_catalog(scope, path.as_ref(), docroot.as_deref(), &opts)
}
