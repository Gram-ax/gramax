use test_utils::*;

use gramaxcore::scan::workspace::ScanOpts;
use gramaxcore::scan::workspace::WorkspaceEntryDto;
use gramaxcore::scan::workspace::WorkspaceScanner;
use gramaxfs::backend::DiskFs;

pub fn opts() -> ScanOpts {
	ScanOpts {
		exclude_dirs: vec![".git".into(), "node_modules".into(), ".storage".into()],
		category_index_filename: vec!["category.yaml".into()],
		docroot_filenames: vec!["docroot.yaml".into()],
		workspace_config_filename: "workspace.yaml".into(),
		docroot_search_depth: 5,
		optional_category_index: false,
		max_concurrency: 8,
		follow_symlinks: false,
		known_workspace_paths: Vec::new(),
	}
}

pub struct Fixture {
	_tmp: TempDir,
	pub root: PathBuf,
	pub fs: DiskFs,
}

impl Fixture {
	pub fn new(tmp: TempDir) -> Self {
		let root = tmp.path().to_path_buf();
		let fs = DiskFs::new(root.clone());
		Self { _tmp: tmp, root, fs }
	}

	pub fn dir(&self, rel: &str) {
		fs::create_dir_all(self.root.join(rel)).unwrap();
	}

	pub fn file(&self, rel: &str, body: &str) {
		let abs = self.root.join(rel);
		if let Some(parent) = abs.parent() {
			fs::create_dir_all(parent).unwrap();
		}
		fs::write(abs, body).unwrap();
	}

	pub fn scan(&self, opts: &ScanOpts) -> Vec<WorkspaceEntryDto> {
		WorkspaceScanner::new(&self.fs, Path::new(""), opts).scan_workspace().unwrap()
	}
}

#[fixture]
pub fn fixture() -> Fixture {
	Fixture::new(sandbox())
}
