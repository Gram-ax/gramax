use crate::actions::prelude::*;
use crate::creds::*;
use crate::prelude::*;

use crate::error::Error;

use crate::repo::Repo;
use crate::ShortInfo;

use std::path::Path;
use std::path::PathBuf;

use git2::BranchType;
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

#[derive(serde::Serialize, Clone)]
pub struct CloneProgress {
  pub received: usize,
  pub total: usize,
}

fn with_creds<C: Creds>(path: &Path, creds: C) -> Result<Repo<C>> {
  let repo = Repo::open(path, creds)?;
  Ok(repo)
}

fn with_dummy_creds(path: &Path) -> Result<Repo<DummyCreds>> {
  let repo = Repo::open(path, DummyCreds)?;
  Ok(repo)
}

pub fn file_history(repo_path: &Path, file_path: &Path, count: usize) -> Result<HistoryInfo> {
  let repo = with_dummy_creds(repo_path)?;
  let history = repo.history(file_path, count)?;
  Ok(history)
}

pub fn branch_info(repo_path: &Path, name: Option<&str>) -> Result<BranchInfo> {
  let repo = with_dummy_creds(repo_path)?;
  let info = if let Some(name) = name {
    repo
      .branch_by_name(name, BranchType::Local)
      .or_else(|_| repo.branch_by_name(name, BranchType::Remote))?
      .short_info()?
  } else {
    repo.branch_by_head()?.short_info()?
  };

  Ok(info)
}

pub fn branch_list(repo_path: &Path) -> Result<Vec<BranchInfo>> {
  let repo = with_dummy_creds(repo_path)?;
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
}

pub fn fetch(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  let repo = with_creds(repo_path, creds)?;
  repo.fetch()?;
  Ok(())
}

pub fn new_branch(repo_path: &Path, name: &str) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.new_branch(name)?;
  Ok(())
}

pub fn delete_branch(
  repo_path: &Path,
  name: &str,
  remote: bool,
  creds: Option<AccessTokenCreds>,
) -> Result<()> {
  match creds {
    Some(creds) if remote => {
      let repo = with_creds(repo_path, creds)?;
      repo.delete_branch_remote(name)?;
    }
    _ => {
      let repo = with_dummy_creds(repo_path)?;
      repo.delete_branch_local(name)?;
    }
  };
  Ok(())
}

pub fn add_remote(repo_path: &Path, name: &str, url: &str) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.add_remote(name, url)?;
  Ok(())
}

pub fn has_remotes(repo_path: &Path) -> Result<bool> {
  let repo = with_dummy_creds(repo_path)?;
  let has_remotes = repo.has_remotes()?;
  Ok(has_remotes)
}

pub fn status(repo_path: &Path) -> Result<StatusInfo> {
  let repo = with_dummy_creds(repo_path)?;
  let info = repo.status()?.short_info()?;
  Ok(info)
}

pub fn status_file(repo_path: &Path, file_path: &Path) -> Result<StatusEntry> {
  let repo = with_dummy_creds(repo_path)?;
  Ok(repo.status_file(file_path)?)
}

pub fn push(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  let repo = with_creds(repo_path, creds)?;
  repo.push()?;
  Ok(())
}

pub fn init_new(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  Repo::init(repo_path, creds)?;
  Ok(())
}

pub fn checkout(repo_path: &Path, ref_name: &str, force: bool) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.checkout(ref_name, force)?;
  Ok(())
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
  let repo = with_dummy_creds(repo_path)?;
  repo.add_glob(patterns.iter())?;
  Ok(())
}

pub fn diff(repo_path: &Path, old: &str, new: &str) -> Result<StatusInfo> {
  let repo = with_dummy_creds(repo_path)?;
  let old = Oid::from_str(old).or_else(|_| repo.get_tree_by_branch_name(old))?;
  let new = Oid::from_str(new).or_else(|_| repo.get_tree_by_branch_name(new))?;
  let statuses = repo.diff(old, new)?;
  Ok(statuses)
}

pub fn reset_all(repo_path: &Path, hard: bool, head: Option<&str>) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  let head = if let Some(head) = head { Some(Oid::from_str(head).map_err(Error::from)?) } else { None };
  repo.reset_all(hard, head)?;
  Ok(())
}

pub fn commit(
  repo_path: &Path,
  creds: AccessTokenCreds,
  message: &str,
  parents: Option<Vec<String>>,
) -> Result<()> {
  let repo = with_creds(repo_path, creds)?;
  match parents {
    Some(parents) => {
      repo.commit_with_parents(message, parents)?;
    }
    _ => {
      repo.commit(message)?;
    }
  };

  Ok(())
}

pub fn graph_head_upstream_files(repo_path: &Path, search_in: &Path) -> Result<UpstreamCountChangedFiles> {
  let repo = with_dummy_creds(repo_path)?;
  Ok(repo.graph_head_upstream_files(search_in)?)
}

pub fn merge(repo_path: &Path, creds: AccessTokenCreds, theirs: &str) -> Result<MergeResult> {
  let repo = with_creds(repo_path, creds)?;
  use crate::actions::merge::Merge;
  Ok(repo.merge(theirs)?)
}

pub fn get_content(repo_path: &Path, path: &Path, oid: Option<&str>) -> Result<String> {
  let repo = with_dummy_creds(repo_path)?;
  let oid = if let Some(oid) = oid { Some(Oid::from_str(oid).map_err(Error::from)?) } else { None };
  let content = repo.get_content(path, oid)?;
  Ok(content)
}

pub fn get_parent(repo_path: &Path, oid: &str) -> Result<Option<String>> {
  let repo = with_dummy_creds(repo_path)?;
  let oid = repo.parent_of(Oid::from_str(oid).map_err(Error::from)?)?;
  Ok(oid.map(|oid| oid.to_string()))
}

pub fn restore(repo_path: &Path, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.restore(paths.iter(), staged)?;
  Ok(())
}

pub fn get_remote(repo_path: &Path) -> Result<Option<String>> {
  let repo = with_dummy_creds(repo_path)?;
  let remote = repo.get_remote()?;
  Ok(remote)
}

pub fn stash(repo_path: &Path, message: Option<&str>, creds: AccessTokenCreds) -> Result<Option<String>> {
  let mut repo = with_creds(repo_path, creds)?;
  let oid = repo.stash(message)?;
  Ok(oid.map(|oid| oid.to_string()))
}

pub fn stash_apply(repo_path: &Path, oid: &str) -> Result<MergeResult> {
  let mut repo = with_dummy_creds(repo_path)?;
  let oid = Oid::from_str(oid).map_err(Error::from)?;
  Ok(repo.stash_apply(oid)?)
}

pub fn stash_delete(repo_path: &Path, oid: &str) -> Result<()> {
  let mut repo = with_dummy_creds(repo_path)?;
  let oid = Oid::from_str(oid).map_err(Error::from)?;
  repo.stash_delete(oid)?;
  Ok(())
}
