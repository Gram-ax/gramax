pub use git2::ErrorClass;
pub use git2::ErrorCode;

pub use git2::Error as GitError;
use std::path::Path;

use crate::ext::walk::Walk;
use crate::file_lock::FileLockError;
use crate::prelude::*;

use git2_lfs::Error as LfsError;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(thiserror::Error, Debug)]
pub enum Error {
	#[error("repository has no workdir")]
	NoWorkdir,

	#[error("no files modified")]
	NoModifiedFiles,

	#[error("the provided string is not utf-8")]
	Utf8,

	#[error("{0}")]
	Healthcheck(#[from] HealthcheckError),

	#[error("{0}")]
	FileLock(#[from] FileLockError),

	#[error("file lock healthcheck failed: {0}")]
	FileLockHealthcheckFailed(HealthcheckError),

	#[error("already cloning with same id: {0}")]
	AlreadyCloningWithSameId(String),

	#[error(transparent)]
	Yaml(#[from] serde_yml::Error),

	#[error(transparent)]
	Lfs(#[from] git2_lfs::Error),

	#[error(transparent)]
	Git(#[from] git2::Error),

	#[error("network error: {status} {message:?}")]
	Network { status: u16, message: Option<String> },

	#[error("io error: {0}")]
	Io(String),
}

impl From<std::io::Error> for Error {
	fn from(value: std::io::Error) -> Self {
		Error::Io(value.to_string())
	}
}

impl Error {
	pub fn code(&self) -> Option<i32> {
		match self {
			Error::Git(err) => Some(err.raw_code().abs()),
			Error::Lfs(err) => {
				if let LfsError::Git2(err) = err {
					Some(err.raw_code().abs())
				} else {
					None
				}
			}
			Error::Healthcheck(err) | Error::FileLockHealthcheckFailed(err) => err.inner.as_ref().map(|e| e.raw_code().abs()),
			Error::Network { status, .. } => Some(*status as i32),
			_ => None,
		}
	}

	#[allow(clippy::unnecessary_cast)]
	pub fn class(&self) -> Option<u32> {
		match self {
			Error::Git(err) => Some(err.class() as u32),

			Error::Lfs(err) => {
				if let LfsError::Git2(err) = err {
					Some(err.class() as u32)
				} else {
					None
				}
			}

			Error::Healthcheck(e) | Error::FileLockHealthcheckFailed(e) => e.inner.as_ref().map(|e| e.raw_class() as u32),

			_ => None,
		}
	}

	pub fn subset(&self) -> i32 {
		match self {
			Error::Git(_) => 1,
			Error::Lfs(_) => 2,

			Error::Healthcheck(err) | Error::FileLockHealthcheckFailed(err) => {
				let has_bad_objects = err.bad_objects.as_ref().is_some_and(|o| !o.is_empty());
				if has_bad_objects {
					3
				} else {
					1
				}
			}

			Error::Utf8 => 4,

			Error::Network { .. } => 5,

			Error::Io(_) => 6,

			Error::Yaml(_) => 7,
			Error::AlreadyCloningWithSameId(_) => 8,
			Error::NoWorkdir => 9,
			Error::NoModifiedFiles => 10,
			Error::FileLock(_) => 11,
		}
	}
}

pub trait OrUtf8Err<'s, T: ?Sized> {
	fn or_utf8_err(self) -> Result<&'s T>;
}

pub trait HealthcheckIfOdbError<T, C: Creds> {
	fn healthcheck_if_odb_error(self, repo: &Repo<C>) -> Result<T>;
}

impl<'s> OrUtf8Err<'s, str> for Option<&'s str> {
	fn or_utf8_err(self) -> Result<&'s str> {
		self.ok_or(Error::Utf8)
	}
}

impl<'s> OrUtf8Err<'s, Path> for Option<&'s Path> {
	fn or_utf8_err(self) -> Result<&'s Path> {
		self.ok_or(Error::Utf8)
	}
}

impl<T, C: Creds> HealthcheckIfOdbError<T, C> for Result<T> {
	fn healthcheck_if_odb_error(self, repo: &Repo<C>) -> Result<T> {
		match self {
			Ok(t) => Ok(t),
			Err(Error::Git(err))
				if err.class() == ErrorClass::Odb
					|| err.class() == ErrorClass::Reference
					|| err.class() == ErrorClass::Tree
					|| err.class() == ErrorClass::Index
					|| err.class() == ErrorClass::Object
					|| err.class() == ErrorClass::Invalid =>
			{
				let bad_objects = repo.healthcheck()?;
				let last_gc = repo.last_gc()?;

				let err = HealthcheckError {
					inner: Some(err),
					bad_objects: if bad_objects.is_empty() { None } else { Some(bad_objects) },
					prev_log: last_gc,
				};

				Err(crate::error::Error::Healthcheck(err))
			}
			_ => self,
		}
	}
}
