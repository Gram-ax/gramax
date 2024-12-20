pub use git2::ErrorClass;
pub use git2::ErrorCode;

pub use git2::Error as GitError;

use std::fmt::Display;
use std::io;

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug)]
pub enum Error {
  Git(git2::Error),
  Io(String),
  NoWorkdir,
  NoModifiedFiles,
  Yaml(serde_yml::Error),
  Utf8,
}

impl From<git2::Error> for Error {
  fn from(value: git2::Error) -> Self {
    Error::Git(value)
  }
}

impl From<io::Error> for Error {
  fn from(value: io::Error) -> Self {
    Error::Io(format!("{}", value))
  }
}

impl From<serde_yml::Error> for Error {
  fn from(value: serde_yml::Error) -> Self {
    Error::Yaml(value)
  }
}

impl Display for Error {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Error::Git(err) => {
        writeln!(f, "{:?}", err)
      }
      Error::Io(err) => writeln!(f, "{}", err),
      Error::NoModifiedFiles => writeln!(f, "No files modified"),
      Error::NoWorkdir => writeln!(f, "Repository has no workdir"),
      Error::Utf8 => writeln!(f, "String was not UTF8"),
      Error::Yaml(err) => writeln!(f, "YAML serialize/deserialize: {}", err),
    }
  }
}
