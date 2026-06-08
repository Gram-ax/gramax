use std::path::Path;
use std::path::PathBuf;

use gramaxgit::commands::TreeReadScope;
use serde::Deserialize;

use crate::backend::DiskFs;
use crate::backend::Fs;
use crate::backend::GitFs;
use crate::compress::CompressOptions;
use crate::error::Result;
use crate::DirStat;
use crate::FileInfo;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", tag = "kind")]
pub enum FsScope {
	Disk { root: PathBuf },
	Git { repo: PathBuf, scope: TreeReadScope },
}

impl FsScope {
	pub fn open(self) -> Box<dyn Fs> {
		match self {
			FsScope::Disk { root } => Box::new(DiskFs::new(root)),
			FsScope::Git { repo, scope } => Box::new(GitFs::new(repo, scope)),
		}
	}
}

pub fn exists(fs: FsScope, path: &Path) -> Result<bool> {
	fs.open().exists(path)
}

pub fn stat(scope: FsScope, path: &Path, follow_link: bool) -> Result<FileInfo> {
	scope.open().stat(path, follow_link)
}

pub fn read(fs: FsScope, path: &Path) -> Result<Vec<u8>> {
	fs.open().read(path)
}

pub fn read_dir_names(fs: FsScope, path: &Path) -> Result<Vec<String>> {
	fs.open().read_dir_names(path)
}

pub fn read_dir_stats(fs: FsScope, path: &Path) -> Result<Vec<DirStat>> {
	fs.open().read_dir_stats(path)
}

pub fn read_link(fs: FsScope, path: &Path) -> Result<PathBuf> {
	fs.open().read_link(path)
}

pub fn write(fs: FsScope, path: &Path, data: &[u8], compress: Option<CompressOptions>) -> Result<()> {
	fs.open().write(path, data, compress)
}

pub fn mv(fs: FsScope, from: &Path, to: &Path) -> Result<()> {
	fs.open().mv(from, to)
}

pub fn copy(fs: FsScope, from: &Path, to: &Path) -> Result<()> {
	fs.open().copy(from, to)
}

pub fn make_dir(fs: FsScope, path: &Path, recursive: bool) -> Result<()> {
	fs.open().make_dir(path, recursive)
}

pub fn remove_dir(fs: FsScope, path: &Path, recursive: bool) -> Result<()> {
	fs.open().remove_dir(path, recursive)
}

pub fn rmfile(fs: FsScope, path: &Path) -> Result<()> {
	fs.open().rmfile(path)
}

pub fn hardlink(fs: FsScope, from: &Path, to: &Path) -> Result<()> {
	fs.open().hardlink(from, to)
}

pub fn delete_empty_dirs(fs: FsScope, path: &Path) -> Result<()> {
	fs.open().delete_empty_dirs(path)
}
