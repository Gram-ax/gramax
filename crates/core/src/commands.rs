use std::path::Path;

use gramaxfs::commands::FsScope;
use tracing::instrument;

use crate::error::Result;

use crate::scan::workspace::ScanOpts;
use crate::scan::workspace::WorkspaceEntryDto;
use crate::scan::workspace::WorkspaceScanner;

#[instrument]
pub fn scan_workspace(scope: FsScope, root: &Path, opts: &ScanOpts) -> Result<Vec<WorkspaceEntryDto>> {
	WorkspaceScanner::new(&*scope.open(), root, opts).scan_workspace()
}
