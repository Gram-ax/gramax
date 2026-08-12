use std::path::PathBuf;

use serde::Deserialize;
use serde::Serialize;

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScanOpts {
	pub exclude_dirs: Vec<String>,
	pub category_index_filename: Vec<String>,
	pub docroot_filenames: Vec<String>,
	pub workspace_config_filename: String,
	pub docroot_search_depth: u8,
	pub optional_category_index: bool,
	pub max_concurrency: usize,
	pub follow_symlinks: bool,
	#[serde(default)]
	pub known_workspace_paths: Vec<String>,
}

impl ScanOpts {
	pub(crate) fn is_excluded(&self, name: &str) -> bool {
		self.exclude_dirs.iter().any(|n| n == name)
	}

	pub(crate) fn is_excluded_dir(&self, name: &str) -> bool {
		name.starts_with('.') || self.is_excluded(name)
	}
}

impl Default for ScanOpts {
	fn default() -> Self {
		Self {
			exclude_dirs: vec![".git".into(), "node_modules".into()],
			category_index_filename: vec!["_index.md".into()],
			docroot_filenames: vec![
				".doc-root.yaml".into(),
				".docroot.yaml".into(),
				".doc-root.yml".into(),
				".docroot.yml".into(),
			],
			workspace_config_filename: "workspace.yaml".into(),
			docroot_search_depth: 5,
			optional_category_index: false,
			max_concurrency: 8,
			follow_symlinks: false,
			known_workspace_paths: Vec::new(),
		}
	}
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FsEventDto {
	pub rel_path: PathBuf,
	pub kind: FsEventKind,
}

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum FsEventKind {
	Created,
	Modified,
	Removed,
	Renamed { from: PathBuf },
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceEntryDto {
	pub rel_path: PathBuf,
	pub docroot_rel: Option<PathBuf>,
	pub catalog_props: serde_json::Value,
	pub is_git_repo: bool,
	pub is_bare_repo: bool,
	pub has_gitmodules: bool,
}
