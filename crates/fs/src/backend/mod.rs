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
		match open_delimiter_len(&bytes) {
			None => bytes.clear(),
			Some(open) => {
				if let Some((_, after_close)) = close_delimiter(&bytes[open..]) {
					bytes.truncate(open + after_close);
				}
			}
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

/// Length of the opening `---` delimiter line (including its trailing LF) if `bytes` starts with one.
/// Tolerates trailing whitespace before the LF. Doubles as a close-delimiter line test for streaming readers.
pub fn open_delimiter_len(bytes: &[u8]) -> Option<usize> {
	let after = bytes.strip_prefix(b"---")?;
	let lf = after.iter().position(|b| *b == b'\n')?;
	after[..lf].iter().all(|b| matches!(b, b' ' | b'\t' | b'\r')).then_some(3 + lf + 1)
}

/// Locates the closing `---` delimiter inside `body` (everything after the opening line).
/// Returns `(yaml_end, after_close)` — yaml bytes are `body[..yaml_end]`, post-frontmatter
/// content starts at `body[after_close..]`. Tolerates trailing whitespace on the close line.
pub fn close_delimiter(body: &[u8]) -> Option<(usize, usize)> {
	let mut from = 0usize;
	while let Some(idx) = body[from..].windows(4).position(|w| w == b"\n---") {
		let yaml_end = from + idx;
		let dash_end = yaml_end + 4;
		let tail = &body[dash_end..];
		match tail.iter().position(|b| *b == b'\n') {
			Some(i) if tail[..i].iter().all(|b| matches!(b, b' ' | b'\t' | b'\r')) => {
				return Some((yaml_end, dash_end + i + 1));
			}
			Some(_) => from = dash_end,
			None => {
				return tail.iter().all(|b| matches!(b, b' ' | b'\t' | b'\r')).then_some((yaml_end, body.len()));
			}
		}
	}
	None
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

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn open_delimiter_matches_plain() {
		assert_eq!(open_delimiter_len(b"---\nbody"), Some(4));
	}

	#[test]
	fn open_delimiter_tolerates_trailing_whitespace() {
		assert_eq!(open_delimiter_len(b"--- \nbody"), Some(5));
		assert_eq!(open_delimiter_len(b"---\t\r\nbody"), Some(6));
	}

	#[test]
	fn open_delimiter_rejects_non_whitespace_tail() {
		assert_eq!(open_delimiter_len(b"---x\nbody"), None);
	}

	#[test]
	fn open_delimiter_rejects_missing_prefix() {
		assert_eq!(open_delimiter_len(b"x---\nbody"), None);
	}

	#[test]
	fn open_delimiter_rejects_missing_lf() {
		assert_eq!(open_delimiter_len(b"---   "), None);
	}

	#[test]
	fn close_delimiter_basic() {
		// body: "yaml\n---\nrest"
		assert_eq!(close_delimiter(b"yaml\n---\nrest"), Some((4, 9)));
	}

	#[test]
	fn close_delimiter_tolerates_trailing_whitespace() {
		// "yaml\n--- \nrest" — close line is 5 bytes (---, space, LF)
		assert_eq!(close_delimiter(b"yaml\n--- \nrest"), Some((4, 10)));
	}

	#[test]
	fn close_delimiter_skips_false_match() {
		// "\n---abc" is not a close — must keep looking and find next
		assert_eq!(close_delimiter(b"y\n---abc\nz\n---\nbody"), Some((10, 15)));
	}

	#[test]
	fn close_delimiter_unterminated() {
		// "\n---" at EOF with garbage tail
		assert_eq!(close_delimiter(b"yaml\n---abc"), None);
	}

	#[test]
	fn close_delimiter_eof_no_lf() {
		// "\n---" at EOF with whitespace-only tail
		assert_eq!(close_delimiter(b"yaml\n---  "), Some((4, 10)));
	}
}
