use std::path::Path;

use git2::*;
use serde::Serialize;

use crate::creds::Creds;
use crate::prelude::Repo;
use crate::Result;

pub trait Count {
  fn count_changed_files<P: AsRef<Path>>(&self, search_in: P) -> Result<UpstreamCountChangedFiles>;
}

#[derive(Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpstreamCountChangedFiles {
  pub pull: usize,
  pub push: usize,
  pub changed: usize,
  pub has_changes: bool,
}

impl<C: Creds> Count for Repo<'_, C> {
  fn count_changed_files<P: AsRef<Path>>(&self, search_in: P) -> Result<UpstreamCountChangedFiles> {
    let mut upstream_count_files = UpstreamCountChangedFiles::default();

    let head = self.0.head()?;
    let head_branch = self.0.find_branch(head.shorthand().unwrap_or_default(), BranchType::Local)?;
    let head_commit = head.peel_to_commit()?;
    let head_tree = head_commit.tree()?;

    let mut opts = DiffOptions::new();
    opts.force_binary(true).skip_binary_check(true).pathspec(search_in.as_ref()).ignore_submodules(true);

    upstream_count_files.changed =
      self.0.diff_tree_to_index(Some(&head_tree), Some(&self.0.index()?), Some(&mut opts))?.deltas().count();

    if upstream_count_files.changed > 0 {
      upstream_count_files.has_changes = true;
    }

    let Ok(upstream_branch) = head_branch.upstream() else { return Ok(upstream_count_files) };
    let Ok(upstream_commit) = upstream_branch.get().peel_to_commit() else {
      return Ok(upstream_count_files);
    };

    if head_commit.id() != upstream_commit.id() {
      upstream_count_files.has_changes = true
    }

    let upstream_tree = upstream_commit.tree().ok();

    let should_count_push = !self.0.graph_descendant_of(upstream_commit.id(), head_commit.id())?;
    let ancestor_tree = if should_count_push {
      let ancestor = self.0.merge_base(head_commit.id(), upstream_commit.id())?;
      let Some(ancestor_tree) = self.0.find_commit(ancestor).and_then(|commit| commit.tree()).ok() else {
        return Ok(UpstreamCountChangedFiles::default());
      };

      let mut diff = self.0.diff_tree_to_tree(Some(&ancestor_tree), Some(&head_tree), Some(&mut opts))?;
      diff.find_similar(None)?;
      upstream_count_files.push = diff.stats()?.files_changed();
      ancestor_tree
    } else {
      head_tree
    };

    let diff = self.0.diff_tree_to_tree(Some(&ancestor_tree), upstream_tree.as_ref(), Some(&mut opts))?;
    upstream_count_files.pull = diff.stats()?.files_changed();
    Ok(upstream_count_files)
  }
}
