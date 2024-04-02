#[macro_use]
extern crate log;

pub mod branch;
pub mod commands;

pub mod creds;
pub mod diff;
pub mod error;
pub mod prelude;
mod remote_callback;
pub mod repo;
pub mod repo_ext;
pub mod status;

pub(crate) type Result<T> = std::result::Result<T, error::Error>;

pub trait ShortInfo<'i, T> {
  fn short_info(&'i self) -> Result<T>;
}
