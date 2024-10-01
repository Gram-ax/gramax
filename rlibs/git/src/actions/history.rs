use std::marker::PhantomData;
use std::ops::Deref;
use std::path::Path;
use std::path::PathBuf;

use git2::*;

use serde::Serialize;

use crate::creds::Creds;
use crate::prelude::*;
use crate::repo::Repo;
use crate::repo_ext::CommitExt;
use crate::Result;

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

struct HistoryLookup<'r, C: Creds, I: Iterator<Item = Commit<'r>>> {
  revwalk: I,
  remain: usize,
  found: Vec<FileDiff>,

  _marker: PhantomData<C>,
}

impl<'r, C: Creds, I: Iterator<Item = Commit<'r>>> HistoryLookup<'r, C, I> {
  fn new(revwalk: I, max: usize) -> Self {
    HistoryLookup { revwalk, remain: max, found: vec![], _marker: PhantomData }
  }

  fn collect(mut self, initial_path: PathBuf, repo: &'r Repo<C>) -> Result<HistoryInfo> {
    let mut tracked_path = initial_path.clone();
    let mut was_path = initial_path;

    while let Some(commit) = self.revwalk.next() {
      if commit.parent_count() == 0 || self.remain == 0 {
        break;
      }

      let commit_blob = commit.try_get_blob(&repo.0, &tracked_path)?;
      let parent_blob = self.try_get_parent_blob(repo, &commit, &mut tracked_path, &mut was_path)?;
      let should_break = parent_blob.is_none();

      // Skip the commit if the blob is the same as the parent blob
      if matches!((&commit_blob, &parent_blob), (Some(o), Some(p_o)) if o.id() == p_o.id())
        && was_path == tracked_path
      {
        continue;
      }

      let history = self.collect_history_info(
        repo,
        &commit,
        parent_blob.as_ref(),
        commit_blob.as_ref(),
        &tracked_path,
        &was_path,
      )?;

      drop(parent_blob);

      if let Some(history_info) = history {
        self.found.push(history_info);
        self.remain -= 1;
      }

      if should_break {
        break;
      }
    }

    Ok(HistoryInfo(self.found))
  }

  fn try_get_parent_blob(
    &self,
    repo: &'r Repo<C>,
    commit: &Commit,
    tracked_path: &mut PathBuf,
    was_path: &mut PathBuf,
  ) -> Result<Option<Blob>> {
    let Some(parent_commit) = commit.parents().next() else { return Ok(None) };

    parent_commit
      .try_get_blob(&repo.0, tracked_path)
      .transpose()
      .or_else(|| {
        self.try_find_renamed_blob(repo, commit, &parent_commit, tracked_path, was_path).transpose()
      })
      .transpose()
  }

  fn try_find_renamed_blob(
    &self,
    repo: &'r Repo<C>,
    commit: &Commit,
    parent_commit: &Commit,
    tracked_path: &mut PathBuf,
    was_path: &mut PathBuf,
  ) -> Result<Option<Blob>> {
    let mut diff = repo.0.diff_tree_to_tree(Some(&parent_commit.tree()?), Some(&commit.tree()?), None)?;

    let mut find_opts = DiffFindOptions::new();
    find_opts.renames(true);
    diff.find_similar(Some(&mut find_opts))?;

    let diff_file =
      diff.deltas().find(|delta| delta.new_file().path().is_some_and(|path| path.eq(tracked_path.as_path())));

    if let Some(diff_file) = diff_file {
      if let Some(path) = diff_file.old_file().path() {
        let prev_tracked_path = std::mem::replace(tracked_path, path.to_path_buf());
        *was_path = prev_tracked_path;
      }

      parent_commit.try_get_blob(&repo.0, tracked_path)
    } else {
      Ok(None)
    }
  }

  fn collect_history_info(
    &self,
    repo: &'r Repo<C>,
    commit: &Commit,
    parent_blob: Option<&Blob>,
    commit_blob: Option<&Blob>,
    tracked_path: &Path,
    was_path: &Path,
  ) -> Result<Option<FileDiff>> {
    let mut opts = DiffOptions::new();
    opts.force_text(true).context_lines(u32::MAX);
    let diff = FileDiff::from_blobs(
      &repo.0,
      commit,
      parent_blob,
      tracked_path.to_path_buf(),
      commit_blob,
      was_path.to_path_buf(),
      Some(&mut opts),
    )?;

    if diff.has_changes() {
      Ok(Some(diff))
    } else {
      Ok(None)
    }
  }
}

impl<C: Creds> History for Repo<C> {
  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<HistoryInfo> {
    let mut revwalk = self.0.revwalk()?;
    revwalk.push_head()?;

    let revwalk = revwalk
      .filter_map(|oid| oid.and_then(|oid| self.0.find_commit(oid)).ok())
      .filter(|commit| commit.parent_count() > 0);

    HistoryLookup::new(revwalk, max).collect(path.as_ref().to_path_buf(), self)
  }
}
