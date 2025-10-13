use crate::actions::prelude::*;
use crate::cancel_token::CancelToken;
use crate::cancel_token::CancelTokenExt;
use crate::creds::*;
use crate::error::OrUtf8Err;
use crate::ext::prelude::*;
use crate::prelude::*;

use crate::error::Error;
use crate::error::HealthcheckIfOdbError;

use crate::remote_progress::RemoteProgressCallback;
use crate::repo::Repo;
use crate::ShortInfo;

use crate::ShortPathExt;

use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;

use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Debug)]
pub struct GitError {
  pub message: String,
  pub class: Option<u32>,
  pub code: Option<i32>,
}

impl std::fmt::Display for GitError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "git error (")?;
    if let Some(class) = self.class {
      write!(f, "class: {class}")?;

      if self.code.is_some() {
        write!(f, ", ")?;
      }
    }

    if let Some(code) = self.code {
      write!(f, "code: {code}")?;
    }

    write!(f, "): {}", self.message)?;
    Ok(())
  }
}

impl From<Error> for GitError {
  fn from(value: Error) -> Self {
    let code = value.code();
    let class = value.class();

    match value {
      Error::Git(err) => GitError { message: err.message().into(), class, code },
      Error::Healthcheck(err) => GitError { message: err.to_string(), class, code },
      Error::FileLockHealthcheckFailed(err) => GitError { message: err.to_string(), class, code },
      Error::Network { message, .. } => GitError { message: message.unwrap_or_default(), class, code },
      value => GitError { message: value.to_string(), class, code },
    }
  }
}

impl From<crate::file_lock::FileLockError> for GitError {
  fn from(value: crate::file_lock::FileLockError) -> Self {
    GitError { message: value.to_string(), class: None, code: None }
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
    commit: String,
  },
  Reference {
    reference: String,
  },
}

impl TreeReadScope {
  pub fn with<'r, 't: 'r, C: Creds>(self, repo: &'t Repo<'r, C>) -> Result<RepoTreeScope<'t, 'r, C>> {
    let tree = match self {
      TreeReadScope::Head => repo.read_tree_head()?,
      TreeReadScope::Commit { commit } => repo.read_tree_commit(commit.parse().map_err(Error::from)?)?,
      TreeReadScope::Reference { reference } => repo.read_tree_reference(&reference)?,
    };

    Ok(tree)
  }
}

#[derive(serde::Serialize, Clone)]
pub struct CloneProgress {
  pub received: usize,
  pub total: usize,
}

#[tracing::instrument(err)]
pub fn file_history(repo: &Path, file_path: &Path, count: usize) -> Result<HistoryInfo> {
  Repo::run_rw_read(repo, DummyCreds, |repo| {
    Ok(repo.history(file_path, count).healthcheck_if_odb_error(&repo)?)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn branch_info(repo: &Path, name: Option<&str>) -> Result<BranchInfo> {
  match name {
    Some(name) => {
      Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.branch_by_name(name, None)?.short_info()?))
    }
    None => Repo::run_rw_read_no_lock(repo, DummyCreds, |repo| Ok(repo.branch_by_head()?.short_info()?)),
  }
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn default_branch(repo: &Path, creds: AccessTokenCreds) -> Result<Option<BranchInfo>> {
  Repo::run_rw_read(repo, creds, |repo| {
    Ok(repo.default_branch()?.as_ref().map(ShortInfo::short_info).transpose()?)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn branch_list(repo: &Path) -> Result<Vec<BranchInfo>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| {
    let mut res: Vec<BranchInfo> = vec![];

    for branch in repo.branches(None)? {
      let branch = branch?;

      if branch.0.name()?.or_utf8_err()?.ends_with("HEAD") {
        continue;
      }

      let short_info = repo.resolve_branch_entry(branch)?.short_info()?;

      match res.iter_mut().find(|b| short_info.name == b.name) {
        Some(found) => _ = std::mem::replace(found, short_info),
        None => res.push(short_info),
      };
    }
    Ok(res)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn fetch(repo: &Path, creds: AccessTokenCreds, opts: RemoteOptions, lock: bool) -> Result<()> {
  if lock {
    Repo::run_rw_write(repo, creds, "fetch", |repo| {
      Ok(repo.fetch(opts, Rc::new(|_| {})).healthcheck_if_odb_error(&repo)?)
    })
  } else {
    Repo::run_rw_read(repo, creds, |repo| {
      Ok(repo.fetch(opts, Rc::new(|_| {})).healthcheck_if_odb_error(&repo)?)
    })
  }
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn set_head(repo: &Path, refname: &str) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "set_head", |repo| Ok(repo.set_head(refname)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn new_branch(repo: &Path, name: &str) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "new_branch", |repo| {
    repo.new_branch(name)?;
    Ok(())
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn delete_branch(repo: &Path, name: &str, remote: bool, creds: Option<AccessTokenCreds>) -> Result<()> {
  match creds {
    Some(creds) if remote => {
      Repo::run_rw_write(repo, creds, "delete_branch_remote", |repo| Ok(repo.delete_branch_remote(name)?))?
    }
    _ => {
      Repo::run_rw_write(repo, DummyCreds, "delete_branch_local", |repo| Ok(repo.delete_branch_local(name)?))?
    }
  };
  Ok(())
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn add_remote(repo: &Path, name: &str, url: &str) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "add_remote", |repo| Ok(repo.add_remote(name, url)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn has_remotes(repo: &Path) -> Result<bool> {
  Repo::run_rw_read_no_lock(repo, DummyCreds, |repo| Ok(repo.has_remotes()?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn status(repo: &Path, index: bool) -> Result<StatusInfo> {
  Repo::run_rw_read(repo, DummyCreds, |repo| {
    let status = repo.status(index).healthcheck_if_odb_error(&repo)?.short_info()?;
    info!("status ({}): {status}", status.entries().len());
    Ok(status)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn status_file(repo: &Path, file_path: &Path) -> Result<StatusEntry> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.status_file(file_path).healthcheck_if_odb_error(&repo)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn push(repo: &Path, creds: AccessTokenCreds) -> Result<()> {
  Repo::run_rw_write(repo, creds, "push", |repo| {
    Ok(repo.push(RemoteOptions::default(), Rc::new(|_| {})).healthcheck_if_odb_error(&repo)?)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn init_new(repo: &Path, creds: AccessTokenCreds) -> Result<()> {
  Repo::init(repo, creds)?;
  Ok(())
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn checkout(repo: &Path, ref_name: &str, force: bool) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "checkout", |repo| {
    Ok(repo.checkout(ref_name, force).healthcheck_if_odb_error(&repo)?)
  })
}

#[tracing::instrument(skip(callback), err)]
pub fn clone(creds: AccessTokenCreds, opts: CloneOptions, callback: RemoteProgressCallback) -> Result<()> {
  Repo::clone(creds, opts, callback)?;
  Ok(())
}

#[tracing::instrument(skip(callback), fields(repo = %repo.short()), err)]
pub fn recover(
  repo: &Path,
  creds: AccessTokenCreds,
  cancel_token: CancelToken<'_>,
  callback: RemoteProgressCallback,
) -> Result<()> {
  let res = Repo::run_rw_write_no_lock(repo, creds, |mut repo| Ok(repo.recover(cancel_token, callback)?));
  crate::cache::reset_repo();
  res
}

#[tracing::instrument(ret)]
pub fn cancel(id: usize) -> Result<bool> {
  Repo::<AccessTokenCreds>::cancel(id).map_err(Into::into)
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn add(repo: &Path, patterns: Vec<PathBuf>, force: bool) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "add", |repo| {
    let add_result = if force { repo.add_glob_force(patterns) } else { repo.add_glob(patterns) };
    let Err(err) = add_result else { return Ok(()) };
    error!(target: "git:add", "failed to add: {err:?}");
    Ok(())
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn diff(repo: &Path, opts: DiffConfig) -> Result<DiffTree2TreeInfo> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.diff(opts).healthcheck_if_odb_error(&repo)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn reset(repo: &Path, opts: ResetOptions) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "reset", |repo| Ok(repo.reset(opts).healthcheck_if_odb_error(&repo)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn commit(repo: &Path, creds: AccessTokenCreds, opts: CommitOptions) -> Result<()> {
  Repo::run_rw_write(repo, creds, "commit", |repo| {
    repo.commit(opts).healthcheck_if_odb_error(&repo)?;
    Ok(())
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn count_changed_files(repo: &Path, search_in: &Path) -> Result<UpstreamCountChangedFiles> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.count_changed_files(search_in)?))
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn get_commit_info(repo: &Path, oid: &str, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>> {
  let oid = Oid::from_str(oid).map_err(Error::from)?;
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.get_commit_info(oid, opts)?))
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn merge(repo: &Path, creds: AccessTokenCreds, opts: MergeOptions) -> Result<MergeResult> {
  Repo::run_rw_write(repo, creds, "merge", |repo| Ok(repo.merge(opts).healthcheck_if_odb_error(&repo)?))
}

pub fn format_merge_message(
  repo: &Path,
  creds: AccessTokenCreds,
  opts: MergeMessageFormatOptions,
) -> Result<String> {
  Repo::run_rw_read(repo, creds, |repo| Ok(repo.format_merge_message(opts)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn get_content(repo: &Path, path: &Path, oid: Option<&str>) -> Result<String> {
  Repo::run_rw_read(repo, DummyCreds, |repo| {
    let oid = if let Some(oid) = oid { Some(Oid::from_str(oid).map_err(Error::from)?) } else { None };
    let content = repo.get_content(path, oid)?;
    Ok(content)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn get_parent(repo: &Path, oid: &str) -> Result<Option<String>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| {
    let oid = repo.parent_of(Oid::from_str(oid).map_err(Error::from)?)?;
    Ok(oid.map(|oid| oid.to_string()))
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn restore(repo: &Path, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "restore", |repo| Ok(repo.restore(paths.iter(), staged)?))
}

#[tracing::instrument(fields(repo = %repo.short()))]
pub fn get_remote(repo: &Path) -> Result<Option<String>> {
  Repo::run_rw_read_no_lock(repo, DummyCreds, |repo| Ok(repo.get_remote()?))
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn stash(repo: &Path, message: Option<&str>, creds: AccessTokenCreds) -> Result<Option<String>> {
  Repo::run_rw_write(repo, creds, "stash", |mut repo| {
    let oid = repo.stash(message).healthcheck_if_odb_error(&repo)?;
    Ok(oid.map(|oid| oid.to_string()))
  })
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn stash_apply(repo: &Path, oid: &str) -> Result<MergeResult> {
  Repo::run_rw_write(repo, DummyCreds, "stash_apply", |mut repo| {
    let oid = Oid::from_str(oid).map_err(Error::from)?;
    Ok(repo.stash_apply(oid).healthcheck_if_odb_error(&repo)?)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn stash_delete(repo: &Path, oid: &str) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "stash_delete", |mut repo| {
    let oid = Oid::from_str(oid).map_err(Error::from)?;
    repo.stash_delete(oid).healthcheck_if_odb_error(&repo)?;
    Ok(())
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn find_refs_by_globs(repo: &Path, patterns: &[String]) -> Result<Vec<RefInfo>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.find_refs_by_globs(patterns)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn read_file(repo: &Path, scope: TreeReadScope, path: &Path) -> Result<Vec<u8>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(scope.with(&repo)?.read_to_vec(path)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn read_dir(repo: &Path, scope: TreeReadScope, path: &Path) -> Result<Vec<DirEntry>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(scope.with(&repo)?.read_dir(path)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn read_dir_stats(repo: &Path, scope: TreeReadScope, path: &Path) -> Result<Vec<DirStat>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(scope.with(&repo)?.read_dir_stats(path)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn file_stat(repo: &Path, scope: TreeReadScope, path: &Path) -> Result<Stat> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(scope.with(&repo)?.stat(path)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn file_exists(repo: &Path, scope: TreeReadScope, path: &Path) -> Result<bool> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(scope.with(&repo)?.exists(path)?))
}

pub fn is_init(repo: &Path) -> Result<bool> {
  Ok(Repo::open(repo, DummyCreds).is_ok())
}

pub fn is_bare(repo: &Path) -> Result<bool> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.0.is_bare() || repo.0.workdir().is_none()))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn list_merge_requests(repo: &Path) -> Result<Vec<MergeRequest>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.list_merge_requests().healthcheck_if_odb_error(&repo)?))
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn create_or_update_merge_request(
  repo: &Path,
  merge_request: CreateMergeRequest,
  creds: AccessTokenCreds,
) -> Result<()> {
  Repo::run_rw_write(repo, creds, "create_or_update_merge_request", |repo| {
    Ok(repo.create_or_update_merge_request(merge_request).healthcheck_if_odb_error(&repo)?)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn get_draft_merge_request(repo: &Path) -> Result<Option<MergeRequest>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| {
    Ok(repo.get_draft_merge_request().healthcheck_if_odb_error(&repo)?)
  })
}

#[tracing::instrument(fields(repo = %repo.short()), err)]
pub fn get_all_commit_authors(repo: &Path) -> Result<Vec<CommitAuthorInfo>> {
  Repo::run_rw_read(repo, DummyCreds, |repo| Ok(repo.get_all_authors()?))
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn healthcheck(repo: &Path) -> Result<()> {
  use crate::ext::walk::Walk;

  Repo::run_rw_read_no_lock(repo, DummyCreds, |repo| {
    let healthcheck = repo.healthcheck()?;

    if !healthcheck.is_empty() {
      let err = HealthcheckError { bad_objects: Some(healthcheck), inner: None, prev_log: None };
      return Err(Error::Healthcheck(err).into());
    }

    Ok(())
  })
}

#[tracing::instrument(fields(repo = %repo.short()), ret)]
pub fn gc(repo: &Path, opts: GcOptions) -> Result<()> {
  Repo::run_rw_write(repo, DummyCreds, "gc", |repo| Ok(repo.gc(opts)?))
}

#[tracing::instrument]
pub fn get_all_cancel_tokens() -> Result<Vec<usize>> {
  Ok(Repo::<AccessTokenCreds>::get_all_ids().into_iter().map(|id| id.get()).collect())
}

pub fn reset_repo() {
  crate::cache::reset_repo()
}

pub fn reset_file_lock(repo: &Path) {
  crate::cache::reset_file_lock(repo)
}
