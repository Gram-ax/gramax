use std::path::Component;
use std::path::Path;
use std::path::PathBuf;

use crate::compress::CompressOptions;
use crate::error::IoError;
use crate::DirStat;
use crate::FileInfo;

pub mod disk;
pub mod git;

pub use disk::DiskFs;
pub use git::GitFs;

pub type Result<T> = std::result::Result<T, IoError>;

pub trait Fs: Send + Sync {
	fn root(&self) -> &Path;

	fn exists(&self, path: &Path) -> Result<bool>;
	fn stat(&self, path: &Path, follow_link: bool) -> Result<FileInfo>;
	fn read(&self, path: &Path) -> Result<Vec<u8>>;
	/// Read at most `max_bytes` from the start of the file.
	/// Default impl reads the whole file then truncates — non-disk backends (OPFS, git-tree,
	/// network) should override to stream and avoid the full-read cost.
	fn read_partial(&self, path: &Path, max_bytes: usize) -> Result<Vec<u8>> {
		let mut bytes = self.read(path)?;
		if bytes.len() > max_bytes {
			bytes.truncate(max_bytes);
		}
		Ok(bytes)
	}

	/// Read frontmatter region (from start of file through closing `---\n` fence inclusive).
	/// Empty result means no frontmatter at start. Full file returned when fence unterminated.
	/// Default impl reads whole file and truncates; backends may override with streaming.
	fn read_frontmatter(&self, path: &Path) -> Result<Vec<u8>> {
		let mut bytes = self.read(path)?;
		if let Some(end) = frontmatter_end_offset(&bytes) {
			bytes.truncate(end);
		} else if !has_frontmatter_start(&bytes) {
			bytes.clear();
		}
		Ok(bytes)
	}

	fn read_dir_names(&self, path: &Path) -> Result<Vec<String>>;
	fn read_dir_stats(&self, path: &Path) -> Result<Vec<DirStat>>;
	fn read_link(&self, path: &Path) -> Result<PathBuf>;

	fn write(&self, _path: &Path, _data: &[u8], _compress: Option<CompressOptions>) -> Result<()>;
	fn mv(&self, _from: &Path, _to: &Path) -> Result<()>;
	fn copy(&self, _from: &Path, _to: &Path) -> Result<()>;
	fn make_dir(&self, _path: &Path, _recursive: bool) -> Result<()>;
	fn remove_dir(&self, _path: &Path, _recursive: bool) -> Result<()>;
	fn rmfile(&self, _path: &Path) -> Result<()>;
	fn hardlink(&self, _from: &Path, _to: &Path) -> Result<()>;
	fn delete_empty_dirs(&self, _path: &Path) -> Result<()>;
}

pub(crate) fn has_frontmatter_start(bytes: &[u8]) -> bool {
	bytes.starts_with(b"---\n") || bytes.starts_with(b"---\r\n")
}

pub(crate) fn frontmatter_end_offset(bytes: &[u8]) -> Option<usize> {
	let prefix = if bytes.starts_with(b"---\n") {
		4
	} else if bytes.starts_with(b"---\r\n") {
		5
	} else {
		return None;
	};
	let body = &bytes[prefix..];
	if let Some(i) = find_subslice(body, b"\n---\n") {
		Some(prefix + i + b"\n---\n".len())
	} else {
		find_subslice(body, b"\n---\r\n").map(|i| prefix + i + b"\n---\r\n".len())
	}
}

fn find_subslice(haystack: &[u8], needle: &[u8]) -> Option<usize> {
	if needle.is_empty() || haystack.len() < needle.len() {
		return None;
	}
	haystack.windows(needle.len()).position(|w| w == needle)
}

/// Lexically normalize `..` and `.` components without touching the disk
pub fn lexically_normalize(path: &Path) -> PathBuf {
	let mut out = PathBuf::new();
	for c in path.components() {
		match c {
			Component::CurDir => {}
			Component::ParentDir => {
				out.pop();
			}
			other => out.push(other.as_os_str()),
		}
	}
	out
}

/// Resolve `path` against `root` and verify the result stays inside `root`.
pub fn sandbox_resolve(root: &Path, path: &Path) -> Result<PathBuf> {
	let joined = if path.is_absolute() { path.to_path_buf() } else { root.join(path) };
	let normalized = lexically_normalize(&joined);
	let normalized_root = lexically_normalize(root);
	if !normalized.starts_with(&normalized_root) {
		return Err(IoError::would_escape(root.display(), path.display()));
	}
	Ok(normalized)
}
