use std::path::Path;
use std::path::PathBuf;

use gramaxgit::commands as git;
use gramaxgit::commands::TreeReadScope;

use super::Fs;
use super::Result;
use crate::error::IoError;
use crate::DirStat;
use crate::FileInfo;

const TAG: &str = "fs::git";

#[derive(Debug)]
pub struct GitFs {
	repo_path: PathBuf,
	scope: TreeReadScope,
}

impl GitFs {
	pub fn new(repo_path: PathBuf, scope: TreeReadScope) -> Self {
		Self { repo_path, scope }
	}

	pub fn head(repo_path: PathBuf) -> Self {
		Self::new(repo_path, TreeReadScope::Head)
	}
}

impl Fs for GitFs {
	fn root(&self) -> &Path {
		&self.repo_path
	}

	#[instrument(target = TAG)]
	fn write(&self, _path: &Path, _data: &[u8], _compress: Option<crate::compress::CompressOptions>) -> Result<()> {
		Err(IoError::not_supported("write"))
	}

	#[instrument(target = TAG)]
	fn mv(&self, _from: &Path, _to: &Path) -> Result<()> {
		Err(IoError::not_supported("mv"))
	}

	#[instrument(target = TAG)]
	fn copy(&self, _from: &Path, _to: &Path) -> Result<()> {
		Err(IoError::not_supported("copy"))
	}

	#[instrument(target = TAG)]
	fn make_dir(&self, _path: &Path, _recursive: bool) -> Result<()> {
		Err(IoError::not_supported("make_dir"))
	}

	#[instrument(target = TAG)]
	fn remove_dir(&self, _path: &Path, _recursive: bool) -> Result<()> {
		Err(IoError::not_supported("remove_dir"))
	}

	#[instrument(target = TAG)]
	fn rmfile(&self, _path: &Path) -> Result<()> {
		Err(IoError::not_supported("rmfile"))
	}

	#[instrument(target = TAG)]
	fn hardlink(&self, _from: &Path, _to: &Path) -> Result<()> {
		Err(IoError::not_supported("hardlink"))
	}

	#[instrument(target = TAG)]
	fn delete_empty_dirs(&self, _path: &Path) -> Result<()> {
		Err(IoError::not_supported("delete_empty_dirs"))
	}

	#[instrument(target = TAG)]
	fn exists(&self, path: &Path) -> Result<bool> {
		git::file_exists(&self.repo_path, self.scope.clone(), path).map_err(Into::into)
	}

	#[instrument(target = TAG)]
	fn stat(&self, path: &Path, _follow_link: bool) -> Result<FileInfo> {
		git::file_stat(&self.repo_path, self.scope.clone(), path)
			.map(stat_to_file_info)
			.map_err(Into::into)
	}

	fn read(&self, path: &Path) -> Result<Vec<u8>> {
		git::read_file(&self.repo_path, self.scope.clone(), path).map_err(Into::into)
	}

	#[instrument(target = TAG)]
	fn read_dir_names(&self, path: &Path) -> Result<Vec<String>> {
		Ok(
			git::read_dir_stats(&self.repo_path, self.scope.clone(), path)?
				.into_iter()
				.map(|d| d.name)
				.collect(),
		)
	}

	fn read_dir_stats(&self, path: &Path) -> Result<Vec<DirStat>> {
		let entries = git::read_dir_stats(&self.repo_path, self.scope.clone(), path)?
			.into_iter()
			.map(git_dir_stat_to_dir_stat)
			.collect();

		Ok(entries)
	}

	fn read_link(&self, _path: &Path) -> Result<PathBuf> {
		Err(IoError::not_supported("read_link"))
	}
}

fn stat_to_file_info(stat: gramaxgit::ext::read_tree::Stat) -> FileInfo {
	let kind = if stat.is_dir { "dir" } else { "file" };
	FileInfo::new_raw(kind.into(), stat.size as u64, 0, 0)
}

fn git_dir_stat_to_dir_stat(d: gramaxgit::ext::read_tree::DirStat) -> DirStat {
	DirStat {
		name: d.name,
		stat: stat_to_file_info(d.stat),
	}
}
