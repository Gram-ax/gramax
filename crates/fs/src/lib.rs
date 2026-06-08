pub mod backend;
pub mod error;

pub mod commands;
pub mod compress;

use std::fs::Metadata;
use std::time::SystemTime;
use std::time::UNIX_EPOCH;

pub use error::Result;
use serde::Serialize;

#[macro_use]
extern crate tracing;

#[derive(Serialize, Debug)]
pub struct FileInfo {
	#[serde(rename = "type")]
	file_kind: String,
	size: u64,
	#[serde(rename = "ctimeMs")]
	created: u128,
	#[serde(rename = "mtimeMs")]
	modified: u128,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DirStat {
	pub name: String,
	#[serde(flatten)]
	pub stat: FileInfo,
}

unsafe impl Send for FileInfo {}

unsafe impl Send for DirStat {}

impl FileInfo {
	pub fn is_dir(&self) -> bool {
		self.file_kind == "dir"
	}

	pub fn is_file(&self) -> bool {
		self.file_kind == "file"
	}

	pub fn is_symlink(&self) -> bool {
		self.file_kind == "symbolic"
	}

	pub fn size(&self) -> u64 {
		self.size
	}

	pub fn modified_ms(&self) -> u128 {
		self.modified
	}

	pub fn created_ms(&self) -> u128 {
		self.created
	}

	pub fn new_raw(file_kind: String, size: u64, created: u128, modified: u128) -> Self {
		Self {
			file_kind,
			size,
			created,
			modified,
		}
	}

	pub fn new(meta: Metadata) -> Result<Self> {
		let kind = if meta.is_file() {
			"file"
		} else if meta.is_dir() {
			"dir"
		} else {
			"symbolic"
		};

		let info = FileInfo {
			file_kind: kind.into(),
			size: meta.len(),
			created: meta
				.created()
				.unwrap_or(SystemTime::now())
				.duration_since(UNIX_EPOCH)
				.unwrap_or_default()
				.as_millis(),
			modified: meta.modified()?.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
		};

		Ok(info)
	}
}
