use std::path::Path;
use std::path::PathBuf;

use git2::*;

use crate::creds::*;
use crate::prelude::*;
use crate::Result;

pub trait CommitExt {
  fn get_blob<'a>(&self, repo: &'a Repository, path: &Path) -> Result<Option<Blob<'a>>>;
}

impl CommitExt for Commit<'_> {
  fn get_blob<'a>(&self, repo: &'a Repository, path: &Path) -> Result<Option<Blob<'a>>> {
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
  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<Vec<FileDiff>>;
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

  fn history<P: AsRef<Path>>(&self, path: P, max: usize) -> Result<Vec<FileDiff>> {
    let mut diffs = vec![];
    let mut remain = max;
    let mut tracked_path = path.as_ref().to_path_buf();

    let lookup_for_rename =
      |commit: &Commit, parent_commit: &Commit, tracked_path: &mut PathBuf| -> Result<Option<Blob>> {
        let mut diff = self.0.diff_tree_to_tree(Some(&parent_commit.tree()?), Some(&commit.tree()?), None)?;

        let mut find_opts = DiffFindOptions::new();
        find_opts.renames(true);
        diff.find_similar(Some(&mut find_opts))?;

        let diff_file = diff
          .deltas()
          .find(|delta| delta.new_file().path().is_some_and(|path| path.eq(tracked_path.as_path())));

        if let Some(diff_file) = diff_file {
          *tracked_path = diff_file.old_file().path().unwrap_or(tracked_path).to_path_buf();
          return parent_commit.get_blob(&self.0, tracked_path);
        }

        Ok(None)
      };

    let mut revwalk = self.0.revwalk()?;
    revwalk.push_head()?;

    for oid in revwalk {
      if remain < 1 {
        break;
      }

      let oid = oid?;
      let commit = self.0.find_commit(oid)?;
      let has_parents = commit.parent_count() > 0;

      if commit.parent_count() > 1 {
        continue;
      }

      let path = tracked_path.clone();

      let commit_blob = commit.get_blob(&self.0, &tracked_path)?;

      let parent_blob = if has_parents {
        let parent_commit = commit.parent(0)?;
        let blob = parent_commit.get_blob(&self.0, &tracked_path)?;

        if let Some(blob) = blob {
          Some(blob)
        } else {
          lookup_for_rename(&commit, &parent_commit, &mut tracked_path)?
        }
      } else {
        None
      };

      if matches!((&commit_blob, &parent_blob), (Some(o), Some(p_o)) if o.id() == p_o.id()) {
        continue;
      }

      let mut opts = DiffOptions::new();
      opts.force_text(true).context_lines(u32::MAX);
      let diff = FileDiff::from_blobs(
        &self.0,
        &commit,
        parent_blob.as_ref(),
        tracked_path.clone(),
        commit_blob.as_ref(),
        path,
        Some(&mut opts),
      )?;

      if diff.has_changes {
        diffs.push(diff);
        remain -= 1;
      }
    }

    Ok(diffs)
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
