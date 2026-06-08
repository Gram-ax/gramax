use std::collections::VecDeque;
use std::path::Path;
use std::path::PathBuf;

use gramaxfs::backend::Fs;
use gramaxfs::error::IoError;
use gramaxfs::DirStat;

use tracing::*;

use crate::error::Result;
use crate::scan::utils::empty_object;
use crate::scan::utils::yaml_to_json_or_empty;
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

	pub fn scan_workspace(&self) -> Result<Vec<WorkspaceEntryDto>> {
		let entries = match self.fp.read_dir_stats(self.root) {
			Ok(e) => e,
			Err(IoError::NotFound { .. }) => return Ok(Vec::new()),
			Err(e) => return Err(e.into()),
		};
		let mut out = self.scan_entries(&entries);
		out.sort_by(|a, b| a.name.cmp(&b.name));
		Ok(out)
	}

	#[cfg(not(target_family = "wasm"))]
	fn scan_entries(&self, entries: &[DirStat]) -> Vec<WorkspaceEntryDto> {
		use rayon::iter::IntoParallelRefIterator;
		use rayon::iter::ParallelIterator;

		entries.par_iter().filter_map(|e| self.scan_entry(e)).collect()
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

		let docroot_abs = self.find_docroot(&dir_path);
		let docroot_rel = docroot_abs.as_ref().and_then(|p| p.strip_prefix(&dir_path).ok()).map(|p| p.to_path_buf());
		let catalog_props = self.read_docroot_props(docroot_abs.as_deref());

		Some(WorkspaceEntryDto {
			rel_path: PathBuf::from(&entry.name),
			name: entry.name.clone(),
			docroot_rel,
			catalog_props,
		})
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

	fn find_docroot(&self, dir: &Path) -> Option<PathBuf> {
		let mut queue: VecDeque<(PathBuf, u8)> = VecDeque::new();
		queue.push_back((dir.to_path_buf(), 0));

		while let Some((dir, depth)) = queue.pop_front() {
			for name in &self.opts.docroot_filenames {
				let candidate = dir.join(name);
				if self.fp.exists(&candidate).unwrap_or(false) {
					return Some(candidate);
				}
			}

			if depth.saturating_add(1) >= self.opts.docroot_search_depth {
				continue;
			}

			let entries = match self.fp.read_dir_stats(&dir) {
				Ok(e) => e,
				Err(_) => continue,
			};

			let mut subdirs: Vec<_> = entries
				.into_iter()
				.filter(|e| e.stat.is_dir() && !self.opts.is_excluded_dir(&e.name))
				.collect();

			subdirs.sort_by(|a, b| a.name.cmp(&b.name));
			for e in subdirs {
				queue.push_back((dir.join(&e.name), depth + 1));
			}
		}

		None
	}

	fn read_docroot_props(&self, docroot_abs: Option<&Path>) -> serde_json::Value {
		let Some(p) = docroot_abs else { return empty_object() };
		match self.fp.read(p) {
			Ok(bytes) => yaml_to_json_or_empty(&bytes).unwrap_or_else(|e| {
				warn!(path = %p.display(), error = %e, "docroot yaml parse failed");
				empty_object()
			}),
			Err(e) => {
				warn!(path = %p.display(), error = ?e, "docroot read failed");
				empty_object()
			}
		}
	}
}
