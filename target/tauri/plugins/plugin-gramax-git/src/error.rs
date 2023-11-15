use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct GitError {
  message: String,
  class: Option<i32>,
  code: Option<i32>,
}

impl From<gramaxgit::error::Error> for GitError {
  fn from(value: gramaxgit::error::Error) -> Self {
    match value {
      gramaxgit::error::Error::Git(err) => GitError {
        message: err.message().into(),
        class: Some(err.class() as i32),
        code: Some(err.code() as i32),
      },
      value => GitError { message: value.to_string(), class: None, code: None },
    }
  }
}

impl From<gramaxgit::error::GitError> for GitError {
  fn from(value: gramaxgit::error::GitError) -> Self {
    gramaxgit::error::Error::Git(value).into()
  }
}

pub type Result<T> = std::result::Result<T, GitError>;
