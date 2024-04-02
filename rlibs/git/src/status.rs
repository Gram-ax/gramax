use std::path::Path;
use std::path::PathBuf;
use std::slice::Iter;

use git2::*;
use serde::Serialize;

use crate::Result;
use crate::ShortInfo;

#[derive(Serialize, PartialEq, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum Status {
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
  pub status: Status,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StatusInfo(Vec<StatusInfoEntry>);

impl StatusInfo {
  pub fn entries(&self) -> Iter<StatusInfoEntry> {
    self.0.iter()
  }
}

impl<'s> From<StatusEntry<'s>> for StatusInfoEntry {
  fn from(value: StatusEntry) -> Self {
    Self { path: PathBuf::from(value.path().unwrap_or_default()), status: value.status().into() }
  }
}

impl From<git2::Status> for Status {
  fn from(value: git2::Status) -> Self {
    use git2::Status as S;
    match value {
      S::CURRENT => Status::Current,
      S::INDEX_NEW | S::WT_NEW => Status::New,
      S::CONFLICTED => Status::Conflict,
      S::INDEX_DELETED | S::WT_DELETED => Status::Delete,
      S::INDEX_RENAMED | S::WT_RENAMED => Status::Rename,
      S::INDEX_MODIFIED | S::WT_MODIFIED => Status::Modified,
      rest => Status::Other(format!("{:?}", rest)),
    }
  }
}

impl<'d> From<DiffDelta<'d>> for StatusInfoEntry {
  fn from(value: DiffDelta<'d>) -> Self {
    let status = match value.status() {
      Delta::Unmodified => Status::Current,
      Delta::Added => Status::New,
      Delta::Deleted => Status::Delete,
      Delta::Modified => Status::Modified,
      Delta::Renamed => Status::Rename,
      Delta::Conflicted => Status::Conflict,
      rest => Status::Other(format!("{:?}", rest)),
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
