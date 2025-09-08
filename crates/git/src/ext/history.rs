use std::collections::HashMap;
use std::ops::Deref;
use std::path::Path;

use git2::*;

use serde::Deserialize;
use serde::Serialize;

use crate::actions::diff::DiffFile;
use crate::creds::Creds;
use crate::error::OrUtf8Err;
use crate::prelude::Branch;
use crate::repo::Repo;
use crate::OidInfo;
use crate::Result;
use crate::ShortInfo;
use crate::SignatureInfo;

const TAG: &str = "git:history";

#[derive(Serialize, Debug)]
#[serde(transparent)]
pub struct HistoryInfo(Vec<DiffFile>);

impl Deref for HistoryInfo {
  type Target = Vec<DiffFile>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitAuthorInfo {
  #[serde(flatten)]
  pub author: SignatureInfo,
  pub count: usize,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BranchCommitsInfo {
  pub authors: Vec<CommitAuthorInfo>,
  pub commits: Vec<String>,
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitInfoOpts {
  pub depth: usize,
  #[serde(default)]
  pub simplify: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitInfo {
  pub author: SignatureInfo,
  pub timestamp: i64,
  pub oid: OidInfo,
  pub summary: String,
  pub parents: Vec<OidInfo>,
}

pub trait History {
  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<HistoryInfo>;

  fn get_all_authors(&self) -> Result<Vec<CommitAuthorInfo>>;

  fn get_branch_commits<S: AsRef<str>>(
    &self,
    ours: S,
    theirs: S,
    max: Option<usize>,
  ) -> Result<BranchCommitsInfo>;

  fn get_commit_info(&self, oid: Oid, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>>;
}

impl<C: Creds> History for Repo<'_, C> {
  fn get_commit_info(&self, oid: Oid, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>> {
    let mut res = Vec::with_capacity(opts.depth);

    let mut revwalk = self.0.revwalk()?;
    revwalk.set_sorting(Sort::TOPOLOGICAL)?;
    revwalk.push(oid)?;

    if opts.simplify {
      revwalk.simplify_first_parent()?;
    }

    for oid in revwalk.take(opts.depth) {
      let oid = oid?;
      let commit = self.0.find_commit(oid)?;
      let author = commit.author();
      let timestamp = commit.time().seconds() * 1000;
      let summary = commit.summary().or_utf8_err()?.to_string();
      let parents = commit.parents().filter_map(|p| p.id().short_info().ok()).collect();

      res.push(CommitInfo {
        author: author.short_info()?,
        timestamp,
        oid: oid.short_info()?,
        summary,
        parents,
      });
    }

    Ok(res)
  }

  fn get_all_authors(&self) -> Result<Vec<CommitAuthorInfo>> {
    let mut authors = HashMap::new();
    let mut revwalk = self.0.revwalk()?;
    revwalk.push_glob("refs/heads/*")?;

    for oid in revwalk {
      let commit = self.0.find_commit(oid?)?;
      let author = commit.author();

      let author_email = author.email().unwrap_or("<invalid-utf8>");

      match authors.get_mut(author_email) {
        Some(count) => *count += 1,
        None => {
          authors.insert(author.short_info()?, 1);
        }
      }
    }

    Ok(authors.into_iter().map(|(author, count)| CommitAuthorInfo { author, count }).collect())
  }

  fn get_branch_commits<S: AsRef<str>>(
    &self,
    ours: S,
    theirs: S,
    limit: Option<usize>,
  ) -> Result<BranchCommitsInfo> {
    let mut authors = HashMap::new();
    let mut commits = vec![];

    let theirs = self.branch_by_name(theirs.as_ref(), None)?;

    let ours = self.branch_by_name(ours.as_ref(), None)?;

    let mut revwalk = self.0.revwalk()?;
    revwalk.push_range(&format!("{}..{}", ours.last_commit.id(), theirs.last_commit.id()))?;

    for oid in revwalk.take(limit.unwrap_or(usize::MAX)) {
      let commit = self.0.find_commit(oid?)?;
      let author = commit.author().short_info()?;

      match commit.summary() {
        Some(summary) => commits.push(summary.to_string()),
        None => commits.push(format!("{} <invalid summary utf-8>", commit.id())),
      }

      match authors.get_mut(&author) {
        Some(count) => *count += 1,
        None => {
          authors.insert(author, 1);
        }
      }
    }

    let authors = authors.into_iter().map(|(author, count)| CommitAuthorInfo { author, count }).collect();

    Ok(BranchCommitsInfo { authors, commits })
  }

  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<HistoryInfo> {
    let mut remain = max;
    let mut history = vec![];

    let mut revwalk = self.0.revwalk()?;
    revwalk.push_head()?;

    let mut revwalk = revwalk.filter_map(|oid| oid.and_then(|oid| self.0.find_commit(oid)).ok());

    let Some(mut older_commit) = revwalk.next() else { return Ok(HistoryInfo(vec![])) };

    let mut inspected = 0;
    let mut path = path.as_ref().to_path_buf();

    for c in revwalk {
      if remain == 0 {
        break;
      }

      // skip merge commits
      if c.parent_count() > 1 {
        continue;
      }

      inspected += 1;

      let newer_commit = std::mem::replace(&mut older_commit, c);
      let newer_commit_tree = newer_commit.tree()?;
      let older_commit_tree = older_commit.tree()?;

      if newer_commit_tree.get_path(path.as_path()).is_err() {
        continue;
      }

      let mut diff_opts = DiffOptions::new();
      diff_opts.enable_fast_untracked_dirs(true).pathspec(path.as_path()).disable_pathspec_match(true);

      match self
        .0
        .diff_tree_to_tree(Some(&older_commit_tree), Some(&newer_commit_tree), Some(&mut diff_opts))?
        .deltas()
        .next()
      {
        Some(delta) if delta.status() == Delta::Modified => {
          history.push(DiffFile::from_diff_delta(&self.0, &newer_commit, &delta)?);
          remain -= 1;
          continue;
        }
        Some(_) => {}
        None => {
          continue;
        }
      };

      let mut diff = self.0.diff_tree_to_tree(Some(&older_commit_tree), Some(&newer_commit_tree), None)?;
      let mut find_opts = DiffFindOptions::new();
      find_opts.renames(true).exact_match_only(true);
      diff.find_similar(Some(&mut find_opts))?;

      if let Some(delta) = diff.deltas().find(|delta| {
        delta.new_file().path().is_some_and(|p| p.eq(&path))
          && matches!(delta.status(), Delta::Modified | Delta::Renamed)
      }) {
        let diff = DiffFile::from_diff_delta(&self.0, &newer_commit, &delta)?;
        if let Some(p) = delta.old_file().path() {
          path = p.to_path_buf();
        }
        history.push(diff);
        remain -= 1;
        continue;
      }

      let mut diff = self.0.diff_tree_to_tree(Some(&older_commit_tree), Some(&newer_commit_tree), None)?;
      let mut find_opts = DiffFindOptions::new();
      find_opts.renames(true).exact_match_only(false);
      diff.find_similar(Some(&mut find_opts))?;

      if let Some(delta) = diff.deltas().find(|delta| delta.new_file().path().is_some_and(|p| p.eq(&path))) {
        let diff = DiffFile::from_diff_delta(&self.0, &newer_commit, &delta)?;
        if let Some(p) = delta.old_file().path() {
          path = p.to_path_buf();
        }
        history.push(diff);
        remain -= 1;
        continue;
      }
    }

    // collect the init commit if we've crawled to the end
    if history.len() < max {
      let diff = self.0.diff_tree_to_tree(None, Some(&older_commit.tree()?), None)?;

      if let Some(delta) = diff.deltas().find(|delta| delta.new_file().path().is_some_and(|p| p.eq(&path))) {
        let diff = DiffFile::from_diff_delta(&self.0, &older_commit, &delta)?;
        history.push(diff);
      }
    }

    info!(
      target: TAG,
      "looked up for history of file {}; inspected {} commits & collected {}/{} history entries",
      path.display(),
      inspected,
      history.len(),
      max
    );

    Ok(HistoryInfo(history))
  }
}
