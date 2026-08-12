use std::path::Path;
use std::path::PathBuf;

use gramaxfs::backend::Fs;
use gramaxfs::error::IoError;
use gramaxfs::DirStat;

use tracing::*;

use crate::error::Result;
use crate::scan::utils::find_docroot;
use crate::scan::utils::read_docroot_props;
use crate::scan::workspace::ScanOpts;
use crate::scan::workspace::WorkspaceEntryDto;

pub struct WorkspaceScanner<'a> {
	fp: &'a dyn Fs,
	root: &'a Path,
	opts: &'a ScanOpts,
}

impl<'a> WorkspaceScanner<'a> {
	pub fn new(fp: &'a dyn Fs, root: &'a Path, opts: &'a ScanOpts) -> Self {
		Self { fp, root, opts }
	}

	pub fn scan(&self) -> Result<Vec<WorkspaceEntryDto>> {
		let _otel = gramaxfs::suppress_orphan_telemetry();
		let entries = match self.fp.read_dir_stats(self.root) {
			Ok(e) => e,
			Err(IoError::NotFound { .. }) => return Ok(Vec::new()),
			Err(e) => return Err(e.into()),
		};
		let mut out = self.scan_entries(&entries);
		out.sort_by(|a, b| a.rel_path.cmp(&b.rel_path));
		Ok(out)
	}

	#[cfg(not(target_family = "wasm"))]
	fn scan_entries(&self, entries: &[DirStat]) -> Vec<WorkspaceEntryDto> {
		use rayon::iter::IntoParallelRefIterator;
		use rayon::iter::ParallelIterator;

		entries
			.par_iter()
			.filter_map(|e| {
				let _otel = gramaxfs::suppress_orphan_telemetry();
				self.scan_entry(e)
			})
			.collect()
	}

	#[cfg(target_family = "wasm")]
	fn scan_entries(&self, entries: &[DirStat]) -> Vec<WorkspaceEntryDto> {
		entries.iter().filter_map(|e| self.scan_entry(e)).collect()
	}

	fn scan_entry(&self, entry: &DirStat) -> Option<WorkspaceEntryDto> {
		if !entry.stat.is_dir() || self.opts.is_excluded_dir(&entry.name) {
			return None;
		}

		let dir_path = self.root.join(&entry.name);
		let dir_abs = self.fp.root().join(&dir_path);

		if self.is_nested_known_workspace(&dir_abs) {
			info!(dir = %entry.name, reason = "known-workspace-path", "nested workspace skipped");
			return None;
		}

		let workspace_yaml = dir_path.join(&self.opts.workspace_config_filename);
		if self.fp.exists(&workspace_yaml).unwrap_or(false) {
			info!(dir = %entry.name, reason = "has workspace.yaml", "nested workspace skipped");
			return None;
		}

		let docroot_abs = find_docroot(self.fp, &dir_path, self.opts);
		let docroot_rel = docroot_abs.as_ref().and_then(|p| p.strip_prefix(&dir_path).ok()).map(|p| p.to_path_buf());
		let catalog_props = read_docroot_props(self.fp, docroot_abs.as_deref());
		let (is_git_repo, is_bare_repo, has_gitmodules) = self.detect_git(&dir_path, &entry.name);

		Some(WorkspaceEntryDto {
			rel_path: PathBuf::from(&entry.name),
			docroot_rel,
			catalog_props,
			is_git_repo,
			is_bare_repo,
			has_gitmodules,
		})
	}

	fn detect_git(&self, dir: &Path, name: &str) -> (bool, bool, bool) {
		let bare_suffix = name.ends_with(".git");
		let dotgit = dir.join(".git");
		let has_dotgit = self.fp.exists(&dotgit).unwrap_or(false);

		if !bare_suffix && !has_dotgit {
			return (false, false, false);
		}

		let config_path = if bare_suffix && !has_dotgit {
			dir.join("config")
		} else {
			dotgit.join("config")
		};

		let is_bare = match self.fp.read(&config_path) {
			Ok(bytes) => std::str::from_utf8(&bytes).map(|s| s.contains("bare = true")).unwrap_or(false),
			Err(_) => false,
		};

		let has_gitmodules = self.fp.exists(&dir.join(".gitmodules")).unwrap_or(false);

		(true, is_bare, has_gitmodules)
	}

	fn is_nested_known_workspace(&self, dir_abs: &Path) -> bool {
		self.opts.known_workspace_paths.iter().any(|wp| {
			let wp_path = Path::new(wp);
			let resolved = if wp_path.is_absolute() {
				wp_path.to_path_buf()
			} else {
				self.fp.root().join(wp_path)
			};
			resolved.starts_with(dir_abs)
		})
	}

}
