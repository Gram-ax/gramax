use crate::actions::prelude::*;
use crate::creds::*;
use crate::prelude::*;

use crate::error::Error;

use crate::repo::Repo;
use crate::ShortInfo;

use std::path::Path;
use std::path::PathBuf;

use git2::BranchType;
use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct GitError {
  pub message: String,
  pub class: Option<i32>,
  pub code: Option<i32>,
}

impl From<Error> for GitError {
  fn from(value: Error) -> Self {
    match value {
      Error::Git(err) => GitError {
        message: err.message().into(),
        class: Some(err.class() as i32),
        code: Some(err.code() as i32),
      },
      value => GitError { message: value.to_string(), class: None, code: None },
    }
  }
}

impl From<crate::error::GitError> for GitError {
  fn from(value: crate::error::GitError) -> Self {
    Error::Git(value).into()
  }
}

pub type Result<T> = std::result::Result<T, GitError>;

#[derive(Deserialize, Default, Debug)]
#[serde(untagged)]
pub enum TreeReadScope {
  #[default]
  Head,
  Commit {
    oid: String,
  },
  Reference {
    name: String,
  },
}

impl TreeReadScope {
  pub fn with<C: Creds>(self, repo: &Repo<C>) -> Result<RepoTreeScope<C>> {
    let tree = match self {
      TreeReadScope::Head => repo.read_tree_head()?,
      TreeReadScope::Commit { oid } => repo.read_tree_commit(oid.parse().map_err(Error::from)?)?,
      TreeReadScope::Reference { name } => repo.read_tree_reference(&name)?,
    };
    Ok(tree)
  }
}

#[derive(serde::Serialize, Clone)]
pub struct CloneProgress {
  pub received: usize,
  pub total: usize,
}

pub fn file_history(repo_path: &Path, file_path: &Path, count: usize) -> Result<HistoryInfo> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.history(file_path, count)?))
}

pub fn branch_info(repo_path: &Path, name: Option<&str>) -> Result<BranchInfo> {
  Repo::execute_without_creds(repo_path, |repo| {
    let info = if let Some(name) = name {
      repo
        .branch_by_name(name, BranchType::Local)
        .or_else(|_| repo.branch_by_name(name, BranchType::Remote))?
        .short_info()?
    } else {
      repo.branch_by_head()?.short_info()?
    };

    Ok(info)
  })
}

pub fn branch_list(repo_path: &Path) -> Result<Vec<BranchInfo>> {
  Repo::execute_without_creds(repo_path, |repo| {
    let mut res: Vec<BranchInfo> = vec![];

    for branch in repo.branches(None)? {
      let short_info = repo.resolve_branch_entry(branch?)?.short_info()?;
      if short_info.name == "HEAD" {
        continue;
      }

      match res.iter_mut().find(|b| short_info.name == b.name) {
        Some(found) => _ = std::mem::replace(found, short_info),
        None => res.push(short_info),
      };
    }
    Ok(res)
  })
}

pub fn fetch(repo_path: &Path, creds: AccessTokenCreds, force: bool) -> Result<()> {
  Repo::execute_with_creds(repo_path, creds, |repo| Ok(repo.fetch(force)?))
}

pub fn set_head(repo_path: &Path, refname: &str) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.set_head(refname)?))
}

pub fn new_branch(repo_path: &Path, name: &str) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| {
    repo.new_branch(name)?;
    Ok(())
  })
}

pub fn delete_branch(
  repo_path: &Path,
  name: &str,
  remote: bool,
  creds: Option<AccessTokenCreds>,
) -> Result<()> {
  match creds {
    Some(creds) if remote => Repo::execute_with_creds(repo_path, creds, |repo| Ok(repo.delete_branch_remote(name)?))?,
    _ => Repo::execute_without_creds(repo_path, |repo| Ok(repo.delete_branch_local(name)?))?,
  };
  Ok(())
}

pub fn add_remote(repo_path: &Path, name: &str, url: &str) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.add_remote(name, url)?))
}

pub fn has_remotes(repo_path: &Path) -> Result<bool> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.has_remotes()?))
}

pub fn status(repo_path: &Path) -> Result<StatusInfo> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.status()?.short_info()?))
}

pub fn status_file(repo_path: &Path, file_path: &Path) -> Result<StatusEntry> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.status_file(file_path)?))
}

pub fn push(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  Repo::execute_with_creds(repo_path, creds, |repo| Ok(repo.push()?))
}

pub fn init_new(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  Repo::init(repo_path, creds)?;
  Ok(())
}

pub fn checkout(repo_path: &Path, ref_name: &str, force: bool) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.checkout(ref_name, force)?))
}

pub fn clone(creds: AccessTokenCreds, opts: CloneOptions, callback: CloneProgressCallback) -> Result<()> {
  let cloned_repo = Repo::clone(creds, opts, callback);
  if let Err(err) = cloned_repo {
    println!("{:?}", err);
    return Err(err.into());
  }
  Ok(())
}

pub fn add(repo_path: &Path, patterns: Vec<PathBuf>) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.add_glob(patterns.iter())?))
}

pub fn diff(repo_path: &Path, old: &str, new: &str) -> Result<StatusInfo> {
  Repo::execute_without_creds(repo_path, |repo| {
    let old = Oid::from_str(old).or_else(|_| repo.get_tree_by_branch_name(old))?;
    let new = Oid::from_str(new).or_else(|_| repo.get_tree_by_branch_name(new))?;
    let statuses = repo.diff(old, new)?;
    Ok(statuses)
  })
}

pub fn reset_all(repo_path: &Path, hard: bool, head: Option<&str>) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| {
    let head = if let Some(head) = head { Some(Oid::from_str(head).map_err(Error::from)?) } else { None };
    Ok(repo.reset_all(hard, head)?)
  })
}

pub fn commit(
  repo_path: &Path,
  creds: AccessTokenCreds,
  message: &str,
  parents: Option<Vec<String>>,
) -> Result<()> {
  Repo::execute_with_creds(repo_path, creds, |repo| {
    match parents {
      Some(parents) => repo.commit_with_parents(message, parents)?,
      _ => repo.commit(message)?,
    };
    Ok(())
  })
}

pub fn graph_head_upstream_files(repo_path: &Path, search_in: &Path) -> Result<UpstreamCountChangedFiles> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.graph_head_upstream_files(search_in)?))
}

pub fn merge(repo_path: &Path, creds: AccessTokenCreds, theirs: &str) -> Result<MergeResult> {
  Repo::execute_with_creds(repo_path, creds, |repo| Ok(repo.merge(theirs)?))
}

pub fn get_content(repo_path: &Path, path: &Path, oid: Option<&str>) -> Result<String> {
  Repo::execute_without_creds(repo_path, |repo| {
    let oid = if let Some(oid) = oid { Some(Oid::from_str(oid).map_err(Error::from)?) } else { None };
    let content = repo.get_content(path, oid)?;
    Ok(content)
  })
}

pub fn get_parent(repo_path: &Path, oid: &str) -> Result<Option<String>> {
  Repo::execute_without_creds(repo_path, |repo| {
    let oid = repo.parent_of(Oid::from_str(oid).map_err(Error::from)?)?;
    Ok(oid.map(|oid| oid.to_string()))
  })
}

pub fn restore(repo_path: &Path, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.restore(paths.iter(), staged)?))
}

pub fn get_remote(repo_path: &Path) -> Result<Option<String>> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.get_remote()?))
}

pub fn stash(repo_path: &Path, message: Option<&str>, creds: AccessTokenCreds) -> Result<Option<String>> {
  Repo::execute_with_creds(repo_path, creds, |mut repo| {
    let oid = repo.stash(message)?;
    Ok(oid.map(|oid| oid.to_string()))
  })
}

pub fn stash_apply(repo_path: &Path, oid: &str) -> Result<MergeResult> {
  Repo::execute_without_creds(repo_path, |mut repo| {
    let oid = Oid::from_str(oid).map_err(Error::from)?;
    Ok(repo.stash_apply(oid)?)
  })
}

pub fn stash_delete(repo_path: &Path, oid: &str) -> Result<()> {
  Repo::execute_without_creds(repo_path, |mut repo| {
    let oid = Oid::from_str(oid).map_err(Error::from)?;
    repo.stash_delete(oid)?;
    Ok(())
  })
}

pub fn find_refs_by_globs(repo_path: &Path, patterns: &[String]) -> Result<Vec<RefInfo>> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.find_refs_by_globs(patterns)?))
}

pub fn read_file(repo_path: &Path, scope: TreeReadScope, path: &Path) -> Result<Vec<u8>> {
  Repo::execute_without_creds(repo_path, |repo| Ok(scope.with(&repo)?.read_to_vec(path)?))
}

pub fn read_dir(repo_path: &Path, scope: TreeReadScope, path: &Path) -> Result<Vec<DirEntry>> {
  Repo::execute_without_creds(repo_path, |repo| Ok(scope.with(&repo)?.read_dir(path)?))
}

pub fn file_stat(repo_path: &Path, scope: TreeReadScope, path: &Path) -> Result<Stat> {
  Repo::execute_without_creds(repo_path, |repo| Ok(scope.with(&repo)?.stat(path)?))
}

pub fn file_exists(repo_path: &Path, scope: TreeReadScope, path: &Path) -> Result<bool> {
  Repo::execute_without_creds(repo_path, |repo| Ok(scope.with(&repo)?.exists(path)?))
}

pub fn is_init(repo_path: &Path) -> Result<bool> {
  Ok(Repo::open(repo_path, DummyCreds).is_ok())
}

pub fn is_bare(repo_path: &Path) -> Result<bool> {
  Repo::execute_without_creds(repo_path, |repo| Ok(repo.0.is_bare() || repo.0.workdir().is_none()))
}

pub fn invalidate_repo_cache(repo_paths: Vec<PathBuf>) -> Result<()> {
  crate::cache::invalidate_cache(repo_paths)
}
