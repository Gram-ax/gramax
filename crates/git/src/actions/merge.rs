use std::path::Path;
use std::path::PathBuf;

use build::CheckoutBuilder;
use git2::*;
use serde::Deserialize;
use serde::Serialize;

use crate::prelude::Branch;

use crate::creds::ActualCreds;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::prelude::History;
use crate::repo::Repo;

const TAG: &str = "git:merge";

pub trait Merge {
  fn merge(&self, opts: MergeOptions) -> Result<MergeResult>;
  fn format_merge_message(&self, opts: MergeMessageFormatOptions) -> Result<String>;
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MergeOptions {
  pub theirs: String,

  #[serde(default)]
  pub delete_after_merge: bool,

  #[serde(default)]
  pub squash: bool,

  #[serde(default)]
  pub is_merge_request: bool,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MergeMessageFormatOptions {
  pub theirs: String,

  #[serde(default)]
  pub ours: Option<String>,

  #[serde(default)]
  pub squash: bool,

  #[serde(default)]
  pub max_commits: Option<usize>,

  #[serde(default)]
  pub is_merge_request: bool,
}

impl MergeOptions {
  pub fn theirs<S: AsRef<str>>(theirs: S) -> Self {
    Self {
      theirs: theirs.as_ref().to_string(),
      delete_after_merge: false,
      squash: false,
      is_merge_request: false,
    }
  }
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

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(untagged)]
pub enum MergeResult {
  Ok,
  Conflicts(Vec<MergeConflictInfo>),
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

impl<C: ActualCreds> Merge for Repo<'_, C> {
  fn merge(&self, opts: MergeOptions) -> Result<MergeResult> {
    info!(target: TAG, "preparing to merge {} into head", opts.theirs);

    let theirs_branch = opts.theirs.as_str();

    let theirs = self
      .branch_by_name(theirs_branch, Some(BranchType::Remote))
      .or_else(|_| self.branch_by_name(theirs_branch, Some(BranchType::Local)))?;

    let fetch_commit = self.0.find_annotated_commit(theirs.last_commit.id())?;

    let res = match self.0.merge_analysis(&[&fetch_commit])?.0 {
      x if x.is_fast_forward() => self.merge_as_fast_forward(fetch_commit)?,
      x if x.is_normal() => self.merge_as_normal(
        self.0.head()?.name().or_utf8_err()?,
        theirs.branch.name()?.or_utf8_err()?,
        &fetch_commit,
        opts.squash,
        opts.is_merge_request,
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

  fn format_merge_message(&self, opts: MergeMessageFormatOptions) -> Result<String> {
    let head = self.0.head()?;

    let ours = match &opts.ours {
      Some(ours) => ours,
      None => head.shorthand().or_utf8_err()?,
    };

    let mut msg = String::new();

    if opts.is_merge_request {
      msg.push_str("Resolve merge request ");
      if opts.squash {
        msg.push_str("and squash");
      }

      msg.push_str(&format!(": '{}' into '{}'\n\n", ours, opts.theirs.trim_start_matches("origin/")));
    } else {
      msg.push_str("Merge ");

      if opts.squash {
        msg.push_str("and squash ");
      }

      msg.push_str(&format!("branch '{}' into '{}'\n\n", opts.theirs.trim_start_matches("origin/"), ours));
    }

    let mut commits = self.get_branch_commits(ours, &opts.theirs, Some(opts.max_commits.unwrap_or(50)))?;

    commits.authors.sort_by_key(|a| a.count);

    msg.push_str("\nAuthors:\n");

    for author in commits.authors {
      msg.push_str(&format!("\t* {} <{}>\n", author.author.name, author.author.email));
    }

    msg.push_str("\nCommits:\n");

    for commit in commits.commits {
      msg.push_str(&format!("\t* {commit}\n"));
    }

    Ok(msg)
  }
}

impl<C: ActualCreds> Repo<'_, C> {
  fn merge_as_fast_forward(&self, fetch_commit: AnnotatedCommit) -> Result<MergeResult> {
    info!(target: TAG, "fast-forwarding to given fetch commit; oid: {}", fetch_commit.id());
    let mut head = self.0.head()?;
    let msg = format!("fast-forward: Setting HEAD to id: {}", fetch_commit.id());
    head.set_target(fetch_commit.id(), &msg)?;
    self.0.set_head(head.name().or_utf8_err()?)?;
    self.0.checkout_head(Some(CheckoutBuilder::default().force()))?;
    Ok(MergeResult::Ok)
  }

  fn merge_as_normal(
    &self,
    ours: &str,
    theirs: &str,
    remote: &AnnotatedCommit,
    squash: bool,
    is_merge_request: bool,
  ) -> Result<MergeResult> {
    let local = self.0.reference_to_annotated_commit(&self.0.head()?)?;
    let commit = self.0.find_commit(local.id())?;
    let remote_commit = self.0.find_commit(remote.id())?;

    let ancestor = match self
      .0
      .merge_base(commit.id(), remote_commit.id())
      .and_then(|oid| self.0.find_commit(oid))
    {
      Ok(ancestor) => {
        info!(target: TAG, "merging theirs branch {} (oid {}) into {} (oid {}); ancestor commit oid: {}", theirs, remote_commit.id(), ours, commit.id(), ancestor.id());
        ancestor.tree()?
      }
      Err(err) => {
        let msg = format!(
          "tried to merge theirs branch {} (oid {}) into {} (oid {}) but ancestor was not found",
          theirs,
          remote_commit.id(),
          ours,
          commit.id()
        );

        error!(target: TAG, "{msg}");
        let err = git2::Error::new(err.code(), err.class(), format!("{msg}\noriginal git error: {err}"));
        return Err(err.into());
      }
    };

    let mut opts = git2::MergeOptions::new();
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

    let msg = self.format_merge_message(MergeMessageFormatOptions {
      theirs: theirs.to_string(),
      ours: Some(ours.replace("refs/heads", "")),
      squash,
      max_commits: Some(50),
      is_merge_request,
    })?;

    let parents = if squash { vec![&commit] } else { vec![&commit, &remote_commit] };

    self.0.commit(Some("HEAD"), &signature, &signature, &msg, &tree, &parents)?;

    Ok(MergeResult::Ok)
  }
}
