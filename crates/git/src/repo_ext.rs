use std::path::Path;

use git2::*;

use crate::creds::*;
use crate::Result;

const TAG: &str = "git:ext";

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
  #[deprecated(note = "use `read_file` instead")]
  fn get_content<P: AsRef<Path>>(&self, path: P, commit_oid: Option<Oid>) -> Result<String>;
  fn get_tree_by_branch_name(&self, branch: &str) -> Result<Oid>;
  fn parent_of(&self, oid: Oid) -> Result<Option<Oid>>;
}

impl<C: Creds> RepoExt for crate::repo::Repo<'_, C> {
  fn get_content<P: AsRef<Path>>(&self, path: P, commit_oid: Option<Oid>) -> Result<String> {
    warn!(target: TAG, "DEPRECATED: use `read_file` instead");

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

    debug!(target: TAG, "getting tree from {} branch {}", if kind == BranchType::Remote { "remote" } else { "local" }, name);

    let branch = self.0.find_branch(name, kind)?;
    let oid = branch.get().peel_to_tree()?.id();

    Ok(oid)
  }
}
