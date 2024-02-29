use gramaxgit::creds::*;
use gramaxgit::prelude::*;
use gramaxgit::repo_ext::RepoExt;
use tauri::*;

use gramaxgit::creds::DummyCreds;
use gramaxgit::error::Error;
use gramaxgit::ShortInfo;

use crate::Result;

use std::path::Path;
use std::path::PathBuf;
use std::time::SystemTime;

#[derive(serde::Serialize, Clone)]
struct CloneProgress {
  received: usize,
  total: usize,
}

fn with_root_path(path: &Path) -> PathBuf {
  let path = if path.has_root() { path.strip_prefix("/").unwrap() } else { path };
  Path::new(&std::env::var("ROOT_PATH").expect("missing ROOT_PATH")).join(path)
}

fn with_creds<C: Creds>(path: &Path, creds: C) -> Result<GitRepository<C>> {
  let repo = GitRepository::open(with_root_path(path), creds)?;
  Ok(repo)
}

fn with_dummy_creds(path: &Path) -> Result<GitRepository<DummyCreds>> {
  let repo = GitRepository::open(with_root_path(path), DummyCreds)?;
  Ok(repo)
}

#[command(async)]
pub(crate) fn file_history(repo_path: &Path, file_path: &Path, count: usize) -> Result<Vec<FileDiff>> {
  let repo = with_dummy_creds(repo_path)?;
  let history = repo.history(file_path, count)?;
  Ok(history)
}

#[command(async)]
pub(crate) fn branch_info(repo_path: &Path, name: Option<&str>) -> Result<BranchInfo> {
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

#[command(async)]
pub(crate) fn branch_list(repo_path: &Path) -> Result<Vec<BranchInfo>> {
  let repo = with_dummy_creds(repo_path)?;
  let mut res: Vec<BranchInfo> = vec![];

  for branch in repo.branches(None)? {
    let branch = branch?;
    let short_info = repo.resolve_branch_entry(branch)?.short_info()?;
    if short_info.name == "HEAD" || res.iter().any(|b| short_info.name == b.name) {
      continue;
    }
    res.push(short_info);
  }

  Ok(res)
}

#[command(async)]
pub(crate) fn fetch(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  let repo = with_creds(repo_path, creds)?;
  repo.fetch()?;
  Ok(())
}

#[command(async)]
pub(crate) fn new_branch(repo_path: &Path, name: &str) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.new_branch(name)?;
  Ok(())
}

#[command(async)]
pub(crate) fn delete_branch(
  repo_path: &Path,
  name: &str,
  remote: bool,
  creds: Option<AccessTokenCreds>,
) -> Result<()> {
  match creds {
    Some(creds) if remote => {
      let repo = with_creds(repo_path, creds)?;
      repo.delete_branch(name, BranchType::Remote)?;
    }
    _ => {
      let repo = with_dummy_creds(repo_path)?;
      repo.delete_branch(name, BranchType::Local)?
    }
  }
  Ok(())
}

#[command(async)]
pub(crate) fn add_remote(repo_path: &Path, name: &str, url: &str) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.add_remote(name, url)?;
  Ok(())
}

#[command(async)]
pub(crate) fn has_remotes(repo_path: &Path) -> Result<bool> {
  let repo = with_dummy_creds(repo_path)?;
  let has_remotes = repo.has_remotes()?;
  Ok(has_remotes)
}

#[command(async)]
pub(crate) fn status(repo_path: &Path) -> Result<StatusInfo> {
  let repo = with_dummy_creds(repo_path)?;
  let info = repo.status()?.short_info()?;
  Ok(info)
}

#[command(async)]
pub(crate) fn push(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  let repo = with_creds(repo_path, creds)?;
  repo.push()?;
  Ok(())
}

#[command(async)]
pub(crate) fn init_new(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  GitRepository::init(with_root_path(repo_path), creds)?;
  Ok(())
}

#[command(async)]
pub(crate) fn checkout(repo_path: &Path, ref_name: &str, force: bool) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.checkout(ref_name, force)?;
  Ok(())
}

#[command(async)]
pub(crate) fn clone<R: Runtime>(
  window: Window<R>,
  repo_path: &Path,
  creds: AccessTokenCreds,
  remote_url: &str,
  branch: Option<&str>,
) -> Result<()> {
  let mut last_event = SystemTime::now();
  let cloned_repo =
    GitRepository::clone(remote_url, with_root_path(repo_path), branch, creds, |received, total| {
      let now = SystemTime::now();
      let elapsed = now.duration_since(last_event);
      if elapsed.is_err() || elapsed.unwrap().as_secs() > 3 {
        last_event = now;
        _ = window.emit_to(window.label(), "clone-progress", CloneProgress { received, total });
      }

      true
    });
  if let Err(err) = cloned_repo {
    println!("{:?}", err);
    return Err(err.into());
  }
  Ok(())
}

#[command(async)]
pub(crate) fn add(repo_path: &Path, patterns: Vec<PathBuf>) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.add_glob(patterns.iter())?;
  Ok(())
}

#[command(async)]
pub(crate) fn diff(repo_path: &Path, old: &str, new: &str) -> Result<StatusInfo> {
  let repo = with_dummy_creds(repo_path)?;
  let old = Oid::from_str(old).or_else(|_| repo.get_tree_by_branch_name(old))?;
  let new = Oid::from_str(new).or_else(|_| repo.get_tree_by_branch_name(new))?;
  let statuses = repo.diff(old, new)?;
  Ok(statuses)
}

#[command(async)]
pub(crate) fn reset_all(repo_path: &Path, hard: bool, head: Option<&str>) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  let head = if let Some(head) = head { Some(Oid::from_str(head).map_err(Error::from)?) } else { None };
  repo.reset_all(hard, head)?;
  Ok(())
}

#[command(async)]
pub(crate) fn commit(
  repo_path: &Path,
  creds: AccessTokenCreds,
  message: &str,
  parents: Option<Vec<&str>>,
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

#[command(async)]
pub(crate) fn merge(repo_path: &Path, creds: AccessTokenCreds, theirs: &str) -> Result<()> {
  let repo = with_creds(repo_path, creds)?;
  repo.merge(theirs)?;
  Ok(())
}

#[command(async)]
pub(crate) fn get_content(repo_path: &Path, path: &Path, oid: Option<&str>) -> Result<String> {
  let repo = with_dummy_creds(repo_path)?;
  let oid = if let Some(oid) = oid { Some(Oid::from_str(oid).map_err(Error::from)?) } else { None };
  Ok(repo.get_content(path, oid)?)
}

#[command(async)]
pub(crate) fn get_parent(repo_path: &Path, oid: &str) -> Result<String> {
  let repo = with_dummy_creds(repo_path)?;
  let oid = repo.parent_of(Oid::from_str(oid).map_err(Error::from)?)?;
  Ok(oid.to_string())
}

#[command(async)]
pub(crate) fn restore(repo_path: &Path, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
  let repo = with_dummy_creds(repo_path)?;
  repo.restore(paths.iter(), staged)?;
  Ok(())
}

#[command(async)]
pub(crate) fn get_remote(repo_path: &Path) -> Result<Option<String>> {
  let repo = with_dummy_creds(repo_path)?;
  let remote = repo.get_remote()?;
  Ok(remote)
}

#[command(async)]
pub(crate) fn stash(repo_path: &Path, message: Option<&str>) -> Result<String> {
  let mut repo = with_dummy_creds(repo_path)?;
  let oid = repo.stash(message)?;
  Ok(oid.to_string())
}

#[command(async)]
pub(crate) fn stash_apply(repo_path: &Path, oid: &str) -> Result<()> {
  let mut repo = with_dummy_creds(repo_path)?;
  let oid = Oid::from_str(oid).map_err(Error::from)?;
  repo.stash_apply(oid)?;
  Ok(())
}

#[command(async)]
pub(crate) fn stash_delete(repo_path: &Path, oid: &str) -> Result<()> {
  let mut repo = with_dummy_creds(repo_path)?;
  let oid = Oid::from_str(oid).map_err(Error::from)?;
  repo.stash_delete(oid)?;
  Ok(())
}
