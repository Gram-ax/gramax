use std::path::Path;

use gramaxfs::commands::FsScope;
use tracing::instrument;

use crate::error::Result;

use crate::scan::catalog::CatalogScanner;
use crate::scan::catalog::CatalogTreeDto;
use crate::scan::workspace::ScanOpts;
use crate::scan::workspace::WorkspaceEntryDto;
use crate::scan::workspace::WorkspaceScanner;

#[instrument]
pub fn scan_workspace(scope: FsScope, root: &Path, opts: &ScanOpts) -> Result<Vec<WorkspaceEntryDto>> {
	WorkspaceScanner::new(&*scope.open(), root, opts).scan()
}

#[instrument]
pub fn scan_catalog(scope: FsScope, path: &Path, docroot_rel: Option<&Path>, opts: &ScanOpts) -> Result<CatalogTreeDto> {
	CatalogScanner::new(&*scope.open(), path, docroot_rel, opts).scan()
}

#[cfg(not(target_family = "wasm"))]
#[instrument(skip(on_batch))]
pub fn watch_workspace<F>(scope: FsScope, opts: crate::watch::WatchOpts, on_batch: F) -> Result<crate::watch::WatchHandle>
where
	F: Fn(Vec<crate::watch::FsEvent>) + Send + Sync + 'static,
{
	crate::watch::watch_workspace(scope, opts, on_batch)
}
