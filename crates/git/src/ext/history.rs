use std::ops::Deref;
use std::path::Path;

use git2::*;

use serde::Serialize;

use crate::creds::Creds;
use crate::prelude::*;
use crate::repo::Repo;
use crate::Result;

const TAG: &str = "git:history";

#[derive(Serialize, Debug)]
#[serde(transparent)]
pub struct HistoryInfo(Vec<FileDiff>);

impl Deref for HistoryInfo {
  type Target = Vec<FileDiff>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

pub trait History {
  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<HistoryInfo>;
}

impl<C: Creds> History for Repo<C> {
  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<HistoryInfo> {
    let mut remain = max;
    let mut history = vec![];

    let mut revwalk = self.0.revwalk()?;
    revwalk.push_head()?;
    revwalk.simplify_first_parent()?;

    let mut revwalk = revwalk.filter_map(|oid| oid.and_then(|oid| self.0.find_commit(oid)).ok());

    let Some(mut older_commit) = revwalk.next() else { return Ok(HistoryInfo(vec![])) };

    let mut inspected = 0;
    let mut path = path.as_ref().to_path_buf();

    for c in revwalk {
      if remain == 0 {
        break;
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
          history.push(FileDiff::from_diff_delta(&self.0, &newer_commit, &delta)?);
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
        let diff = FileDiff::from_diff_delta(&self.0, &newer_commit, &delta)?;
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
        let diff = FileDiff::from_diff_delta(&self.0, &newer_commit, &delta)?;
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
        let diff = FileDiff::from_diff_delta(&self.0, &older_commit, &delta)?;
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
