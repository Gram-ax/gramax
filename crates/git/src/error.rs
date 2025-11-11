pub use git2::ErrorClass;
pub use git2::ErrorCode;

pub use git2::Error as GitError;

use std::fmt::Display;
use std::io;
use std::path::Path;

use crate::ext::walk::Walk;
use crate::file_lock::FileLockError;
use crate::prelude::*;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
  Git(git2::Error),
  Healthcheck(crate::prelude::HealthcheckError),
  Io(String),
  Network { status: u16, message: Option<String> },
  NoWorkdir,
  NoModifiedFiles,
  AlreadyCloningWithSameId(String),
  Yaml(serde_yml::Error),
  FileLock(FileLockError),
  FileLockHealthcheckFailed(HealthcheckError),
  Utf8,
}

impl From<git2::Error> for Error {
  fn from(value: git2::Error) -> Self {
    Error::Git(value)
  }
}

impl From<io::Error> for Error {
  fn from(value: io::Error) -> Self {
    Error::Io(format!("{value}"))
  }
}

impl From<serde_yml::Error> for Error {
  fn from(value: serde_yml::Error) -> Self {
    Error::Yaml(value)
  }
}

impl From<FileLockError> for Error {
  fn from(value: FileLockError) -> Self {
    Error::FileLock(value)
  }
}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Error::Git(err) => {
        writeln!(f, "{err:?}")
      }
      Error::Io(err) => writeln!(f, "{err}"),
      Error::Network { status, message } => {
        writeln!(f, "External network error: {} {}", status, message.as_ref().unwrap_or(&"".to_string()))
      }
      Error::NoModifiedFiles => writeln!(f, "No files modified"),
      Error::NoWorkdir => writeln!(f, "Repository has no workdir"),
      Error::Utf8 => writeln!(f, "String was not UTF8"),
      Error::AlreadyCloningWithSameId(id) => writeln!(f, "Already cloning with same id: {id}"),
      Error::Yaml(err) => writeln!(f, "YAML serialize/deserialize: {err}"),
      Error::Healthcheck(err) => writeln!(f, "{err}"),
      Error::FileLock(err) => writeln!(f, "{err:?}"),
      Error::FileLockHealthcheckFailed(err) => writeln!(f, "{err:?}"),
    }
  }
}

impl Error {
  pub fn code(&self) -> Option<i32> {
    match self {
      Error::Git(err) => Some(err.raw_code().abs()),
      Error::Healthcheck(err) => err.inner.as_ref().map(|e| e.raw_code().abs()),
      Error::FileLockHealthcheckFailed(err) => err.inner.as_ref().map(|e| e.raw_code().abs()),
      Error::Network { status, .. } => Some(*status as i32),
      _ => None,
    }
  }

  #[allow(clippy::unnecessary_cast)]
  pub fn class(&self) -> Option<u32> {
    match self {
      Error::Io(_) => Some(1000),
      Error::Healthcheck(e) => {
        let has_bad_objects = e.bad_objects.as_ref().is_some_and(|o| !o.is_empty());
        if has_bad_objects {
          return Some(1001);
        }

        e.inner.as_ref().map(|e| e.raw_class() as u32)
      }
      Error::FileLockHealthcheckFailed(e) => {
        let has_bad_objects = e.bad_objects.as_ref().is_some_and(|o| !o.is_empty());
        if has_bad_objects {
          return Some(1002);
        }
        e.inner.as_ref().map(|e| e.raw_class() as u32)
      }
      Error::FileLock(_) => Some(1003),
      Error::NoWorkdir => Some(1004),
      Error::NoModifiedFiles => Some(1005),
      Error::AlreadyCloningWithSameId(_) => Some(1006),
      Error::Yaml(_) => Some(1007),
      Error::Utf8 => Some(1008),
      Error::Network { status, .. } => Some(*status as u32),
      Error::Git(err) => Some(err.class() as u32),
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
