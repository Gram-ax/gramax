use std::path::Path;
use std::path::PathBuf;
use std::slice::Iter;

use git2::*;
use serde::Serialize;

use crate::creds::Creds;
use crate::prelude::Repo;
use crate::Result;
use crate::ShortInfo;

const TAG: &str = "git:status";

pub trait Status {
  fn status(&self) -> Result<Statuses>;
  fn status_file<P: AsRef<Path>>(&self, path: P) -> Result<StatusEntry>;
}

#[derive(Serialize, PartialEq, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum StatusEntry {
  Current,
  Delete,
  New,
  Modified,
  Rename,
  Conflict,
  Other(String),
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StatusInfoEntry {
  pub path: PathBuf,
  pub status: StatusEntry,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StatusInfo(Vec<StatusInfoEntry>);

impl StatusInfo {
  pub fn entries(&self) -> Iter<StatusInfoEntry> {
    self.0.iter()
  }
}

impl From<git2::StatusEntry<'_>> for StatusInfoEntry {
  fn from(value: git2::StatusEntry) -> Self {
    Self { path: PathBuf::from(value.path().unwrap_or_default()), status: value.status().into() }
  }
}

impl From<git2::Status> for StatusEntry {
  fn from(value: git2::Status) -> Self {
    use git2::Status as S;
    match value {
      S::CURRENT => StatusEntry::Current,
      S::INDEX_NEW | S::WT_NEW => StatusEntry::New,
      S::CONFLICTED => StatusEntry::Conflict,
      S::INDEX_DELETED | S::WT_DELETED => StatusEntry::Delete,
      S::INDEX_RENAMED | S::WT_RENAMED => StatusEntry::Rename,
      S::INDEX_MODIFIED | S::WT_MODIFIED => StatusEntry::Modified,
      rest => StatusEntry::Other(format!("{:?}", rest)),
    }
  }
}

impl<'d> From<DiffDelta<'d>> for StatusInfoEntry {
  fn from(value: DiffDelta<'d>) -> Self {
    let status = match value.status() {
      Delta::Unmodified => StatusEntry::Current,
      Delta::Added => StatusEntry::New,
      Delta::Deleted => StatusEntry::Delete,
      Delta::Modified => StatusEntry::Modified,
      Delta::Renamed => StatusEntry::Rename,
      Delta::Conflicted => StatusEntry::Conflict,
      rest => StatusEntry::Other(format!("{:?}", rest)),
    };
    Self { path: value.new_file().path().unwrap_or(Path::new("")).to_path_buf(), status }
  }
}

impl<'s> ShortInfo<'s, StatusInfo> for Statuses<'s> {
  fn short_info(&self) -> Result<StatusInfo> {
    let statuses = self.iter().map(StatusInfoEntry::from).collect();
    Ok(StatusInfo(statuses))
  }
}

impl<'d> ShortInfo<'d, StatusInfo> for Diff<'d> {
  fn short_info(&'d self) -> Result<StatusInfo> {
    let statuses = self.deltas().map(StatusInfoEntry::from).collect();
    Ok(StatusInfo(statuses))
  }
}

impl<C: Creds> Status for Repo<C> {
  fn status(&self) -> Result<Statuses> {
    info!(target: TAG, "status");
    self.ensure_trash_ignored()?;
    let mut opts = StatusOptions::default();
    opts
      .include_unmodified(false)
      .include_ignored(false)
      .include_untracked(true)
      .update_index(true)
      .recurse_untracked_dirs(true);
    Ok(self.0.statuses(Some(&mut opts))?)
  }

  fn status_file<P: AsRef<Path>>(&self, path: P) -> Result<StatusEntry> {
    info!(target: TAG, "status file {}", path.as_ref().display());
    Ok(self.0.status_file(path.as_ref())?.into())
  }
}
