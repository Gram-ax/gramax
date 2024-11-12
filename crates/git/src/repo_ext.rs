use std::path::Path;

use git2::*;

use crate::creds::*;
use crate::prelude::*;
use crate::Result;

pub trait CommitExt {
  fn try_get_blob<'a>(&self, repo: &'a Repository, path: &Path) -> Result<Option<Blob<'a>>>;
}

impl CommitExt for Commit<'_> {
  fn try_get_blob<'a>(&self, repo: &'a Repository, path: &Path) -> Result<Option<Blob<'a>>> {
    let blob = self
      .tree()?
      .get_path(path.as_ref())
      .and_then(|entry| entry.to_object(repo))
      .ok()
      .and_then(|o| o.into_blob().ok());
    Ok(blob)
  }
}

pub trait RepoExt {
  fn get_content<P: AsRef<Path>>(&self, path: P, commit_oid: Option<Oid>) -> Result<String>;
  fn get_tree_by_branch_name(&self, branch: &str) -> Result<Oid>;
  fn parent_of(&self, oid: Oid) -> Result<Option<Oid>>;
  fn graph_head_upstream_files<P: AsRef<Path>>(&self, search_in: P) -> Result<UpstreamCountChangedFiles>;
}

impl<C: Creds> RepoExt for crate::repo::Repo<C> {
  fn get_content<P: AsRef<Path>>(&self, path: P, commit_oid: Option<Oid>) -> Result<String> {
    let commit = match commit_oid {
      Some(oid) => self.0.find_commit(oid)?,
      None => self.0.head()?.peel_to_commit()?,
    };

    let object_oid = commit.tree()?.get_path(path.as_ref())?.id();
    let blob = self.0.find_blob(object_oid)?;
    Ok(String::from_utf8_lossy(blob.content()).to_string())
  }

  fn parent_of(&self, commit_oid: Oid) -> Result<Option<Oid>> {
    let oid = self.0.find_commit(commit_oid)?.parents().next().map(|p| p.id());
    Ok(oid)
  }

  fn get_tree_by_branch_name(&self, branch: &str) -> Result<Oid> {
    let (name, kind) =
      if branch.contains("origin/") { (branch, BranchType::Remote) } else { (branch, BranchType::Local) };

    let branch = self.0.find_branch(name, kind)?;
    let oid = branch.get().peel_to_tree()?.id();
    Ok(oid)
  }

  fn graph_head_upstream_files<P: AsRef<Path>>(&self, search_in: P) -> Result<UpstreamCountChangedFiles> {
    let mut upstream_count_files = UpstreamCountChangedFiles::default();
    let head = self.0.head()?;

    let head_branch = self.0.find_branch(head.shorthand().unwrap_or_default(), BranchType::Local)?;
    let Ok(upstream_branch) = head_branch.upstream() else { return Ok(upstream_count_files) };

    let head_commit = head.peel_to_commit()?;
    let Ok(upstream_commit) = upstream_branch.get().peel_to_commit() else {
      return Ok(upstream_count_files);
    };

    if head_commit.id() != upstream_commit.id() {
      upstream_count_files.has_changes = true
    }

    let head_tree = head_commit.tree()?;
    let upstream_tree = upstream_commit.tree().ok();

    let mut opts = DiffOptions::new();
    opts.force_binary(true).skip_binary_check(true).pathspec(search_in.as_ref());

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
