use std::path::PathBuf;

use git2::*;

use serde::Serialize;

use crate::creds::Creds;
use crate::error::Error;
use crate::prelude::Repo;
use crate::Result;

use crate::actions::status::StatusInfo;
use crate::ShortInfo;

const TAG: &str = "git:diff";

pub trait Diff {
  fn conflicts(&self) -> Result<Vec<IndexConflict>>;
  fn diff(&self, old: Oid, new: Oid) -> Result<StatusInfo>;
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
  author_name: String,
  author_email: String,
  commit_oid: String,
  date: i64,
  path: PathBuf,
  content: Option<String>,
  parent_path: Option<PathBuf>,
  parent_content: Option<String>,
  pub has_changes: bool,
}

#[derive(Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpstreamCountChangedFiles {
  pub pull: usize,
  pub push: usize,
  pub has_changes: bool,
}

impl FileDiff {
  pub fn from_blobs(
    repo: &Repository,
    commit: &Commit,
    lhs: Option<&Blob>,
    lhs_path: PathBuf,
    rhs: Option<&Blob>,
    rhs_path: PathBuf,
    opts: Option<&mut DiffOptions>,
  ) -> Result<Self> {
    let signature = commit.author();
    let mut has_changes = false;
    repo.diff_blobs(
      rhs,
      None,
      lhs,
      None,
      opts,
      Some(&mut |_, _| {
        has_changes = true;
        true
      }),
      None,
      None,
      None,
    )?;

    let rhs = rhs.map(|blob| String::from_utf8_lossy(blob.content()).to_string());
    let lhs = lhs.map(|blob| String::from_utf8_lossy(blob.content()).to_string());
    let diff = FileDiff {
      author_name: signature.name().ok_or(Error::Utf8)?.into(),
      author_email: signature.email().ok_or(Error::Utf8)?.into(),
      commit_oid: commit.id().to_string(),
      date: commit.time().seconds() * 1000,
      path: rhs_path,
      content: rhs,
      parent_path: lhs.as_ref().map(|_| lhs_path),
      parent_content: lhs,
      has_changes,
    };

    Ok(diff)
  }

  pub fn from_diff_delta(repo: &Repository, commit: &Commit, delta: &DiffDelta) -> Result<Self> {
    let signature = commit.author();

    Ok(Self {
      author_name: signature.name().ok_or(Error::Utf8)?.into(),
      author_email: signature.email().ok_or(Error::Utf8)?.into(),
      commit_oid: commit.id().to_string(),
      date: commit.time().seconds() * 1000,
      path: delta.new_file().path().map(|p| p.to_path_buf()).ok_or(Error::Utf8)?,
      content: repo
        .find_blob(delta.new_file().id())
        .ok()
        .and_then(|b| String::from_utf8(b.content().to_vec()).ok()),
      parent_path: delta.old_file().path().map(|p| p.to_path_buf()),
      parent_content: repo
        .find_blob(delta.old_file().id())
        .ok()
        .and_then(|b| String::from_utf8(b.content().to_vec()).ok()),
      has_changes: true,
    })
  }

  pub fn has_changes(&self) -> bool {
    self.has_changes || !self.parent_path.as_ref().map(|p| p == &self.path).unwrap_or(true)
  }
}

impl<C: Creds> Diff for Repo<C> {
  fn conflicts(&self) -> Result<Vec<IndexConflict>> {
    let index = self.0.index()?;
    let mut conflicts = vec![];
    for conflict in index.conflicts()? {
      conflicts.push(conflict?);
    }
    Ok(conflicts)
  }

  fn diff(&self, old: Oid, new: Oid) -> Result<StatusInfo> {
    info!(target: TAG, "diff {} to {}", old.to_string(), new.to_string());
    let old_tree = self.0.find_object(old, None).and_then(|o| o.peel_to_tree()).ok();
    let new_tree = self.0.find_object(new, None).and_then(|o| o.peel_to_tree()).ok();

    let mut opts = DiffOptions::new();
    opts.context_lines(0);
    self.0.diff_tree_to_tree(old_tree.as_ref(), new_tree.as_ref(), Some(&mut opts))?.short_info()
  }
}
