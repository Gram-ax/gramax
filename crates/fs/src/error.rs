use std::fmt::Display;
use std::io::{self, ErrorKind};

use serde::Serialize;

pub type Result<T> = std::result::Result<T, IoError>;

#[derive(Serialize, Debug)]
#[serde(tag = "name")]
pub enum IoError {
	Exists { message: String },
	NotFound { message: String },
	Timeout { message: String },
	WouldEscape { message: String },
	NotSupported { message: String },
	Git {
		subset: i32,
		class: Option<u32>,
		code: Option<i32>,
		message: String,
	},
	Other { message: String },
}

impl IoError {
	pub fn would_escape<D: Display>(root: D, path: D) -> Self {
		Self::WouldEscape {
			message: format!("The provided path '{path}' would escape its root '{root}'"),
		}
	}

	pub fn not_supported<D: Display>(operation: D) -> Self {
		Self::NotSupported { message: format!("Operation not supported: {operation}") }
	}

	pub fn other<D: Display>(message: D) -> Self {
		Self::Other { message: message.to_string() }
	}
}

impl From<io::Error> for IoError {
	fn from(value: io::Error) -> Self {
		let message = value.to_string();
		match value.kind() {
			ErrorKind::AlreadyExists => IoError::Exists { message },
			ErrorKind::NotFound => IoError::NotFound { message },
			ErrorKind::TimedOut => IoError::Timeout { message },
			_ => IoError::Other { message },
		}
	}
}

impl From<gramaxgit::commands::ErrorInfo> for IoError {
	fn from(value: gramaxgit::commands::ErrorInfo) -> Self {
		IoError::Git {
			subset: value.subset,
			class: value.class,
			code: value.code,
			message: value.message,
		}
	}
}
