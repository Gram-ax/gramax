use std::fs;
use std::io::Read;
use std::path::Path;
use std::path::PathBuf;

use super::sandbox_resolve;
use super::Fs;
use super::Result;
use crate::compress::CompressOptions;
use crate::DirStat;
use crate::FileInfo;

const TAG: &str = "fs::disk";

#[derive(Debug, Clone)]
pub struct DiskFs {
	root: PathBuf,
}

impl DiskFs {
	pub fn new(root: PathBuf) -> Self {
		Self { root }
	}

	fn sanitize(&self, path: &Path) -> Result<PathBuf> {
		sandbox_resolve(&self.root, path)
	}
}

pub fn getstat(path: PathBuf, follow_link: bool) -> Result<FileInfo> {
	let meta = fs::metadata(&path)?;
	if meta.is_symlink() && follow_link {
		return getstat(fs::read_link(path)?, follow_link);
	}
	FileInfo::new(meta)
}

impl Fs for DiskFs {
	fn root(&self) -> &Path {
		&self.root
	}

	fn exists(&self, path: &Path) -> Result<bool> {
		Ok(self.sanitize(path)?.exists())
	}

	#[instrument(target = TAG)]
	fn stat(&self, path: &Path, follow_link: bool) -> Result<FileInfo> {
		getstat(self.sanitize(path)?, follow_link)
	}

	fn read(&self, path: &Path) -> Result<Vec<u8>> {
		Ok(fs::read(self.sanitize(path)?)?)
	}

	fn read_partial(&self, path: &Path, max_bytes: usize) -> Result<Vec<u8>> {
		let path = self.sanitize(path)?;
		let file = fs::File::open(&path)?;
		let mut buf = Vec::with_capacity(max_bytes.min(8192));
		file.take(max_bytes as u64).read_to_end(&mut buf)?;
		Ok(buf)
	}

	fn read_frontmatter(&self, path: &Path) -> Result<Vec<u8>> {
		use std::io::BufRead;
		use std::io::BufReader;

		let path = self.sanitize(path)?;
		let file = fs::File::open(&path)?;
		let mut reader = BufReader::with_capacity(4096, file);

		let mut buf = Vec::with_capacity(4096);
		reader.read_until(b'\n', &mut buf)?;
		if !super::has_frontmatter_start(&buf) {
			return Ok(Vec::new());
		}

		loop {
			let before = buf.len();
			let n = reader.read_until(b'\n', &mut buf)?;
			if n == 0 {
				return Ok(buf);
			}
			let line = &buf[before..];
			if line == b"---\n" || line == b"---\r\n" {
				return Ok(buf);
			}
		}
	}

	#[instrument(target = TAG)]
	fn read_dir_names(&self, path: &Path) -> Result<Vec<String>> {
		let path = self.sanitize(path)?;
		let mut res = Vec::new();
		for entry in fs::read_dir(path)? {
			res.push(entry?.file_name().to_string_lossy().into_owned());
		}
		res.sort();
		Ok(res)
	}

	#[instrument(target = TAG)]
	fn read_dir_stats(&self, path: &Path) -> Result<Vec<DirStat>> {
		let path = self.sanitize(path)?;
		let entries: Vec<_> = fs::read_dir(path)?.collect::<std::io::Result<_>>()?;
		let mut res = Vec::with_capacity(entries.len());
		for entry in entries {
			let stat = getstat(entry.path(), false)?;
			res.push(DirStat {
				name: entry.file_name().to_string_lossy().into_owned(),
				stat,
			});
		}
		res.sort_by(|a, b| a.name.cmp(&b.name));
		Ok(res)
	}

	fn read_link(&self, path: &Path) -> Result<PathBuf> {
		Ok(fs::read_link(self.sanitize(path)?)?)
	}

	#[instrument(target = TAG, skip(data))]
	fn write(&self, path: &Path, data: &[u8], compress: Option<CompressOptions>) -> Result<()> {
		if let Some(compress) = compress {
			crate::compress::write_compressed(self.sanitize(path)?, data, compress)?;
		} else {
			fs::write(self.sanitize(path)?, data)?;
		}
		Ok(())
	}

	#[instrument(target = TAG)]
	fn mv(&self, from: &Path, to: &Path) -> Result<()> {
		let from = self.sanitize(from)?;
		let to = self.sanitize(to)?;

		if let Some(parent) = to.parent() {
			if !parent.exists() {
				fs::create_dir_all(parent)?;
			}
		}

		let Err(err) = fs::rename(&from, &to) else { return Ok(()) };

		// Resource is Busy (os error 10) or os error 29
		if let Some(10 | 29) = err.raw_os_error() {
			warn!(target: "gramax-fs::mv", "seems resource {} is busy; copying instead of renaming", from.display());

			self.copy(&from, &to)?;
			if fs::metadata(&from)?.is_dir() {
				fs::remove_dir_all(&from)?;
			} else {
				fs::remove_file(&from)?;
			}

			return Ok(());
		}

		Err(err.into())
	}

	#[instrument(target = TAG)]
	fn copy(&self, from: &Path, to: &Path) -> Result<()> {
		let from = self.sanitize(from)?;
		let to = self.sanitize(to)?;
		if fs::metadata(&from)?.is_dir() {
			return Ok(copy_dir::copy_dir(from, to)?.into_iter().next().map(Err).unwrap_or(Ok(()))?);
		}
		fs::copy(from, to)?;
		Ok(())
	}

	#[instrument(target = TAG)]
	fn make_dir(&self, path: &Path, recursive: bool) -> Result<()> {
		let path = self.sanitize(path)?;
		let res = match recursive {
			true => fs::create_dir_all(path),
			false => fs::create_dir(path),
		};
		Ok(res?)
	}

	#[instrument(target = TAG)]
	fn remove_dir(&self, path: &Path, recursive: bool) -> Result<()> {
		let path = self.sanitize(path)?;
		let res = match recursive {
			true => fs::remove_dir_all(path),
			false => fs::remove_dir(path),
		};
		Ok(res?)
	}

	#[instrument(target = TAG)]
	fn rmfile(&self, path: &Path) -> Result<()> {
		Ok(fs::remove_file(self.sanitize(path)?)?)
	}

	#[instrument(target = TAG)]
	fn hardlink(&self, from: &Path, to: &Path) -> Result<()> {
		Ok(fs::hard_link(self.sanitize(from)?, self.sanitize(to)?)?)
	}

	#[instrument(target = TAG)]
	fn delete_empty_dirs(&self, path: &Path) -> Result<()> {
		fn walk(path: &Path) -> Result<()> {
			if !path.exists() || path.file_name().is_some_and(|f| f.eq(".git")) || !path.is_dir() {
				return Ok(());
			}

			let entries: Vec<_> = fs::read_dir(path)?.collect::<std::io::Result<_>>()?;
			for entry in entries {
				if entry.file_type()?.is_dir() {
					let child = entry.path();
					walk(&child)?;
					if child.exists() {
						let mut iter = fs::read_dir(&child)?;
						let empty = iter.next().is_none();
						drop(iter);
						if empty {
							fs::remove_dir(&child)?;
						}
					}
				}
			}

			if path.exists() {
				let mut iter = fs::read_dir(path)?;
				let empty = iter.next().is_none();
				drop(iter);
				if empty {
					fs::remove_dir(path)?;
				}
			}

			Ok(())
		}

		walk(&self.sanitize(path)?)
	}
}
