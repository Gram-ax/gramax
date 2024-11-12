use std::io::{self, ErrorKind};

use serde::Serialize;

pub type Result<T> = std::result::Result<T, IoError>;

#[allow(clippy::upper_case_acronyms)]
#[derive(Serialize, Debug)]
pub enum IoErrorKind {
  EEXISTS,
  ENOENT,
  ETIMEOUT,
  EOTHER,
}

#[derive(Serialize, Debug)]
pub struct IoError {
  name: IoErrorKind,
  message: String,
}

impl IoError {
  fn new(kind: IoErrorKind, error: io::Error) -> Self {
    IoError { name: kind, message: error.to_string() }
  }
}

impl From<io::Error> for IoError {
  fn from(value: io::Error) -> Self {
    let kind = match value.kind() {
      ErrorKind::AlreadyExists => IoErrorKind::EEXISTS,
      ErrorKind::NotFound => IoErrorKind::ENOENT,
      ErrorKind::TimedOut => IoErrorKind::ETIMEOUT,
      _ => IoErrorKind::EOTHER,
    };

    IoError::new(kind, value)
  }
}
