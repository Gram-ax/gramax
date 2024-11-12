#[macro_use]
extern crate log;

pub mod commands;

pub mod actions;
pub mod creds;
pub mod error;
pub mod prelude;
mod remote_callback;
pub mod repo;
pub mod repo_ext;
mod cache;

pub mod git2 {
  pub use git2::*;
}

pub(crate) type Result<T> = std::result::Result<T, error::Error>;

pub trait ShortInfo<'i, T> {
  fn short_info(&'i self) -> Result<T>;
}
