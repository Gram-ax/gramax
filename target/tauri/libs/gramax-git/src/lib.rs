#[macro_use]
extern crate log;

pub mod branch;
pub mod creds;
pub mod diff;
pub mod error;
pub mod repo;
pub mod status;
pub mod prelude;
pub mod repo_ext;

pub(crate) type Result<T> = std::result::Result<T, error::Error>;

pub trait ShortInfo<'i, T> {
  fn short_info(&'i self) -> Result<T>;
}
