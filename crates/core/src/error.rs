use serde::Serialize;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(thiserror::Error, Debug, Serialize)]
#[serde(tag = "kind", content = "message", rename_all = "camelCase")]
pub enum Error {
	#[error("io error: {0}")]
	Io(String),

	#[error("git error: {0}")]
	Git(String),

	#[error("yaml parse error: {0}")]
	Yaml(String),

	#[error("invalid utf-8")]
	Utf8,

	#[error("path escapes root: {0}")]
	PathEscapesRoot(String),

	#[error("not found: {0}")]
	NotFound(String),

	#[error("{0}")]
	Other(String),
}

impl From<gramaxfs::error::IoError> for Error {
	fn from(value: gramaxfs::error::IoError) -> Self {
		Error::Io(format!("{value:?}"))
	}
}

impl From<gramaxgit::error::Error> for Error {
	fn from(value: gramaxgit::error::Error) -> Self {
		match value {
			gramaxgit::error::Error::Yaml(e) => Error::Yaml(e.to_string()),
			gramaxgit::error::Error::Io(s) => Error::Io(s),
			gramaxgit::error::Error::Utf8 => Error::Utf8,
			other => Error::Git(other.to_string()),
		}
	}
}

impl From<std::io::Error> for Error {
	fn from(value: std::io::Error) -> Self {
		Error::Io(value.to_string())
	}
}

impl From<serde_yml::Error> for Error {
	fn from(value: serde_yml::Error) -> Self {
		Error::Yaml(value.to_string())
	}
}

impl From<serde_json::Error> for Error {
	fn from(value: serde_json::Error) -> Self {
		Error::Other(value.to_string())
	}
}
