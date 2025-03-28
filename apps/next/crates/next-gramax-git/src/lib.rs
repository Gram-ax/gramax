use std::path::Path;
use std::path::PathBuf;

use serde::Serialize;

use gramaxgit::commands as git;
use gramaxgit::prelude::*;

use clone::*;

use napi::bindgen_prelude::AsyncTask;
use napi::bindgen_prelude::Buffer;
use napi::Error;
use napi::JsFunction;

#[macro_use]
extern crate napi_derive;

mod clone;

type Output = std::result::Result<String, Error>;

pub trait JsonExt {
  fn json(&self) -> Output;
}

impl<T: Serialize, E: Serialize> JsonExt for Result<T, E> {
  fn json(&self) -> Output {
    match self {
      Ok(ok) => serde_json::to_string(ok).map_err(|e| Error::from_reason(e.to_string())),
      Err(err) => serde_json::to_string(err)
        .map_err(|e| Error::from_reason(e.to_string()))
        .and_then(|e| Err(Error::from_reason(e))),
    }
  }
}

type Input = String;

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct AccessTokenCreds {
  pub author_name: String,
  pub author_email: String,
  pub access_token: String,
  pub username: Option<String>,
  pub protocol: Option<String>,
}

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct CommitOptions {
  pub message: String,
  pub parent_refs: Option<Vec<String>>,
  pub files: Option<Vec<String>>,
}

impl From<CommitOptions> for gramaxgit::actions::commit::CommitOptions {
  fn from(val: CommitOptions) -> Self {
    gramaxgit::actions::commit::CommitOptions {
      message: val.message,
      parent_refs: val.parent_refs,
      files: val.files.map(|files| files.into_iter().map(PathBuf::from).collect()),
    }
  }
}

#[napi(string_enum)]
pub enum TreeReadScopeObjectType {
  Head,
  Commit,
  Reference,
}

#[napi(object, use_nullable = true)]
pub struct TreeReadScope {
  pub object_type: TreeReadScopeObjectType,
  pub reference: Option<String>,
}

impl From<TreeReadScope> for gramaxgit::commands::TreeReadScope {
  fn from(val: TreeReadScope) -> Self {
    use gramaxgit::commands::TreeReadScope;

    let name = val.reference.unwrap_or_default();
    match val.object_type {
      TreeReadScopeObjectType::Head => TreeReadScope::Head,
      TreeReadScopeObjectType::Commit => TreeReadScope::Commit { commit: name },
      TreeReadScopeObjectType::Reference => TreeReadScope::Reference { reference: name },
    }
  }
}

impl From<AccessTokenCreds> for gramaxgit::creds::AccessTokenCreds {
  fn from(val: AccessTokenCreds) -> Self {
    gramaxgit::creds::AccessTokenCreds::new(
      &val.author_name,
      &val.author_email,
      &val.access_token,
      val.username.as_deref(),
      val.protocol.as_deref(),
    )
  }
}

#[napi(js_name = "is_init")]
pub fn is_init(repo_path: String) -> Output {
  git::is_init(Path::new(&repo_path)).json()
}

#[napi(js_name = "is_bare")]
pub fn is_bare(repo_path: String) -> Output {
  git::is_bare(Path::new(&repo_path)).json()
}

#[napi(js_name = "init_new")]
pub fn init_new(path: String, creds: AccessTokenCreds) -> Output {
  git::init_new(Path::new(&path), creds.into()).json()
}

#[napi]
pub fn clone(
  creds: AccessTokenCreds,
  opts: RawCloneOptions,
  callback: JsFunction,
) -> Result<AsyncTask<CloneTask>, napi::Error> {
  CloneTask::create_task(creds, opts, callback)
}

#[napi(js_name = "clone_cancel")]
pub fn clone_cancel(id: i32) -> Output {
  git::clone_cancel(id as usize).json()
}

#[napi]
pub fn status(repo_path: String, index: bool) -> Output {
  git::status(Path::new(&repo_path), index).json()
}

#[napi(js_name = "status_file")]
pub fn status_file(repo_path: String, path: String) -> Output {
  git::status_file(Path::new(&repo_path), Path::new(&path)).json()
}

#[napi(js_name = "default_branch")]
pub fn default_branch(repo_path: String, creds: AccessTokenCreds) -> Output {
  git::default_branch(Path::new(&repo_path), creds.into()).json()
}

#[napi(js_name = "branch_list")]
pub fn branch_list(repo_path: String) -> Output {
  git::branch_list(Path::new(&repo_path)).json()
}

#[napi(js_name = "branch_info")]
pub fn branch_info(repo_path: String, name: Option<String>) -> Output {
  git::branch_info(Path::new(&repo_path), name.as_deref()).json()
}

#[napi(js_name = "new_branch")]
pub fn new_branch(repo_path: String, name: String) -> Output {
  git::new_branch(Path::new(&repo_path), &name).json()
}

#[napi(js_name = "delete_branch")]
pub fn delete_branch(
  repo_path: String,
  creds: Option<AccessTokenCreds>,
  name: String,
  remote: bool,
) -> Output {
  let creds = creds.map(|c| c.into());
  git::delete_branch(Path::new(&repo_path), &name, remote, creds).json()
}

#[napi(js_name = "set_head")]
pub fn set_head(repo_path: String, refname: String) -> Output {
  git::set_head(Path::new(&repo_path), &refname).json()
}

#[napi]
pub fn checkout(repo_path: String, branch: String, create: bool) -> Output {
  git::checkout(Path::new(&repo_path), &branch, create).json()
}

#[napi(js_name = "add_remote")]
pub fn add_remote(repo_path: String, name: String, url: String) -> Output {
  git::add_remote(Path::new(&repo_path), &name, &url).json()
}

#[napi(js_name = "has_remotes")]
pub fn has_remotes(repo_path: String) -> Output {
  git::has_remotes(Path::new(&repo_path)).json()
}

#[napi(js_name = "get_remote")]
pub fn get_remote(repo_path: String) -> Output {
  git::get_remote(Path::new(&repo_path)).json()
}

#[napi]
pub fn fetch(repo_path: String, creds: AccessTokenCreds, force: bool) -> Output {
  git::fetch(Path::new(&repo_path), creds.into(), force).json()
}

#[napi]
pub fn push(repo_path: String, creds: AccessTokenCreds) -> Output {
  git::push(Path::new(&repo_path), creds.into()).json()
}

#[napi(js_name = "file_history")]
pub fn file_history(repo_path: String, file_path: String, count: u32) -> Output {
  git::file_history(Path::new(&repo_path), Path::new(&file_path), count as usize).json()
}

#[napi]
pub fn add(repo_path: String, paths: Vec<String>, force: bool) -> Output {
  let paths: Vec<std::path::PathBuf> = paths.into_iter().map(std::path::PathBuf::from).collect();
  git::add(Path::new(&repo_path), paths, force).json()
}

#[napi]
pub fn commit(repo_path: String, creds: AccessTokenCreds, opts: CommitOptions) -> Output {
  git::commit(Path::new(&repo_path), creds.into(), opts.into()).json()
}

#[napi]
pub fn diff(opts: Input) -> Output {
  #[derive(serde::Deserialize)]
  #[serde(rename_all = "camelCase")]
  struct Options {
    repo_path: String,
    opts: DiffConfig,
  }

  let opts = serde_json::from_str::<Options>(&opts).map_err(|e| Error::from_reason(e.to_string()))?;
  git::diff(Path::new(&opts.repo_path), opts.opts).json()
}

#[napi]
pub fn restore(repo_path: String, staged: bool, paths: Vec<String>) -> Output {
  let paths: Vec<std::path::PathBuf> = paths.into_iter().map(std::path::PathBuf::from).collect();
  git::restore(Path::new(&repo_path), staged, paths).json()
}

#[napi(js_name = "reset_all")]
pub fn reset_all(repo_path: String, hard: bool, head: Option<String>) -> Output {
  git::reset_all(Path::new(&repo_path), hard, head.as_deref()).json()
}

#[napi]
pub fn stash(repo_path: String, creds: AccessTokenCreds, message: Option<String>) -> Output {
  git::stash(Path::new(&repo_path), message.as_deref(), creds.into()).json()
}

#[napi(js_name = "stash_apply")]
pub fn stash_apply(repo_path: String, oid: String) -> Output {
  git::stash_apply(Path::new(&repo_path), &oid).json()
}

#[napi(js_name = "stash_delete")]
pub fn stash_delete(repo_path: String, oid: String) -> Output {
  git::stash_delete(Path::new(&repo_path), &oid).json()
}

#[napi]
pub fn merge(repo_path: String, creds: AccessTokenCreds, theirs: String) -> Output {
  git::merge(Path::new(&repo_path), creds.into(), &theirs).json()
}

#[napi(js_name = "graph_head_upstream_files")]
pub fn graph_head_upstream_files(repo_path: String, search_in: String) -> Output {
  git::graph_head_upstream_files(Path::new(&repo_path), Path::new(&search_in)).json()
}

#[napi(js_name = "get_content")]
pub fn get_content(repo_path: String, path: String, oid: Option<String>) -> Output {
  git::get_content(Path::new(&repo_path), Path::new(&path), oid.as_deref()).json()
}

#[napi(js_name = "get_parent")]
pub fn get_parent(repo_path: String, oid: String) -> Output {
  git::get_parent(Path::new(&repo_path), &oid).json()
}

#[napi(js_name = "git_read_dir")]
pub fn read_dir(repo_path: String, scope: TreeReadScope, path: String) -> Output {
  git::read_dir(Path::new(&repo_path), scope.into(), Path::new(&path)).json()
}

#[napi(js_name = "git_file_stat")]
pub fn file_stat(repo_path: String, scope: TreeReadScope, path: String) -> Output {
  git::file_stat(Path::new(&repo_path), scope.into(), Path::new(&path)).json()
}

#[napi(js_name = "git_file_exists")]
pub fn file_exists(repo_path: String, scope: TreeReadScope, path: String) -> Output {
  git::file_exists(Path::new(&repo_path), scope.into(), Path::new(&path)).json()
}

#[napi(js_name = "git_read_file")]
pub fn read_file(repo_path: String, scope: TreeReadScope, path: String) -> Result<Buffer, Error> {
  match git::read_file(Path::new(&repo_path), scope.into(), Path::new(&path)) {
    Ok(content) => Ok(content.into()),
    Err(err) => serde_json::to_string(&err)
      .map_err(|e| Error::from_reason(e.to_string()))
      .and_then(|e| Err(Error::from_reason(e))),
  }
}

#[napi(js_name = "git_read_dir_stats")]
pub fn read_dir_stats(repo_path: String, scope: TreeReadScope, path: String) -> Output {
  git::read_dir_stats(Path::new(&repo_path), scope.into(), Path::new(&path)).json()
}

#[napi(js_name = "list_merge_requests")]
pub fn list_merge_requests(repo_path: String) -> Output {
  git::list_merge_requests(Path::new(&repo_path)).json()
}

#[napi(js_name = "find_refs_by_globs")]
pub fn find_refs_by_globs(repo_path: String, pattern: Vec<String>) -> Output {
  git::find_refs_by_globs(Path::new(&repo_path), &pattern).json()
}

#[napi(js_name = "reset_repo")]
pub fn reset_repo() -> Result<bool, Error> {
  git::reset_repo();
  Ok(true)
}

#[napi(js_name = "get_all_commit_authors")]
pub fn get_all_commit_authors(repo_path: String) -> Output {
  git::get_all_commit_authors(Path::new(&repo_path)).json()
}
