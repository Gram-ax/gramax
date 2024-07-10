use std::path::Path;
use std::path::PathBuf;

use build::CheckoutBuilder;
use git2::*;
use serde::Serialize;

use crate::prelude::Branch;

use crate::creds::ActualCreds;
use crate::error::Error;
use crate::error::Result;
use crate::repo::Repo;

const TAG: &str = "git:merge";

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum MergeResult {
  Ok,
  Conflicts(Vec<MergeConflictInfo>),
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MergeConflictInfo {
  pub ours: Option<PathBuf>,
  pub theirs: Option<PathBuf>,
  pub ancestor: Option<PathBuf>,
}

impl MergeConflictInfo {
  pub fn from_path<P: AsRef<Path>>(path: P) -> Self {
    let path = path.as_ref().to_path_buf();
    Self { ours: Some(path.clone()), theirs: Some(path.clone()), ancestor: Some(path) }
  }
}

impl MergeResult {
  pub fn has_conflicts(&self) -> bool {
    match self {
      MergeResult::Ok => false,
      MergeResult::Conflicts(vec) => !vec.is_empty(),
    }
  }
}

impl From<IndexConflict> for MergeConflictInfo {
  fn from(value: IndexConflict) -> Self {
    let ours = value.our.and_then(|c| String::from_utf8(c.path).ok()).map(PathBuf::from);
    let theirs = value.their.and_then(|c| String::from_utf8(c.path).ok()).map(PathBuf::from);
    let ancestor = value.ancestor.and_then(|c| String::from_utf8(c.path).ok()).map(PathBuf::from);
    Self { ours, theirs, ancestor }
  }
}

pub trait Merge {
  fn merge<S: AsRef<str>>(&self, theirs_branch: S) -> Result<MergeResult>;
}

impl<C: ActualCreds> Merge for Repo<C> {
  fn merge<S: AsRef<str>>(&self, theirs_branch: S) -> Result<MergeResult> {
    info!(target: TAG, "preparing to merge {} into head", theirs_branch.as_ref());

    let theirs = self
      .branch_by_name(theirs_branch.as_ref(), BranchType::Remote)
      .or_else(|_| self.branch_by_name(theirs_branch, BranchType::Local))?;

    let fetch_commit = self.0.find_annotated_commit(theirs.last_commit.id())?;

    let res = match self.0.merge_analysis(&[&fetch_commit])?.0 {
      x if x.is_fast_forward() => self.merge_as_fast_forward(fetch_commit)?,
      x if x.is_normal() => self.merge_as_normal(
        self.0.head()?.name().ok_or(Error::Utf8)?,
        theirs.branch.name()?.ok_or(Error::Utf8)?,
        &fetch_commit,
      )?,
      x if x.is_up_to_date() => {
        info!(target: TAG, "skipping merge, up to date; no actions needed");
        MergeResult::Ok
      }
      _ => {
        info!(target: TAG, "cancelling merge; no actions needed");
        MergeResult::Ok
      }
    };

    Ok(res)
  }
}

impl<C: ActualCreds> Repo<C> {
  fn merge_as_fast_forward(&self, fetch_commit: AnnotatedCommit) -> Result<MergeResult> {
    info!(target: TAG, "fast-forwarding to given fetch commit; oid: {}", fetch_commit.id());
    let mut head = self.0.head()?;
    let msg = format!("Fast-Forward: Setting HEAD to id: {}", fetch_commit.id());
    head.set_target(fetch_commit.id(), &msg)?;
    self.0.set_head(head.name().ok_or(Error::Utf8)?)?;
    self.0.checkout_head(Some(CheckoutBuilder::default().force()))?;
    Ok(MergeResult::Ok)
  }

  fn merge_as_normal(&self, ours: &str, theirs: &str, remote: &AnnotatedCommit) -> Result<MergeResult> {
    let local = self.0.reference_to_annotated_commit(&self.0.head()?)?;
    let commit = self.0.find_commit(local.id())?;
    let remote_commit = self.0.find_commit(remote.id())?;

    let ancestor = match self
      .0
      .merge_base(commit.id(), remote_commit.id())
      .and_then(|oid| self.0.find_commit(oid))
    {
      Ok(commit) => {
        info!(target: TAG, "merging theirs branch {} (oid {}) into {} (oid {}); ancestor commit oid: {}", theirs, remote_commit.id(), ours, commit.id(), commit.id());
        commit.tree()?
      }
      Err(err) => {
        error!(target: TAG, "tried to merge theirs branch {} (oid {}) into {} (oid {}) but ancestor was not found", theirs, remote_commit.id(), ours, commit.id());
        return Err(err.into());
      }
    };

    let mut opts = MergeOptions::new();
    opts.find_renames(true);

    let mut index = self.0.merge_trees(&ancestor, &commit.tree()?, &remote_commit.tree()?, Some(&opts))?;

    if index.has_conflicts() {
      let mut conflicts = vec![];
      for conflict in index.conflicts()? {
        conflicts.push(MergeConflictInfo::from(conflict?))
      }

      warn!(target: TAG, "found {} conflicts", conflicts.len());
      let mut opts = CheckoutBuilder::new();
      opts.conflict_style_merge(true).allow_conflicts(true);
      self.0.checkout_index(Some(&mut index), Some(&mut opts))?;
      return Ok(MergeResult::Conflicts(conflicts));
    }

    let tree = self.0.find_tree(index.write_tree_to(&self.0)?)?;
    let signature = self.creds().signature()?;
    self.0.commit(
      Some("HEAD"),
      &signature,
      &signature,
      &format!("Merge branch {} into {}", theirs, ours),
      &tree,
      &[&commit, &remote_commit],
    )?;

    Ok(MergeResult::Ok)
  }
}
