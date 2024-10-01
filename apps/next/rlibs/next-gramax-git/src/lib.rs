use std::path::Path;

use gramaxgit::commands as git;
use napi::Env;
use napi::Error;
use napi::JsFunction;
use serde::Serialize;

#[macro_use]
extern crate napi_derive;

type Output = std::result::Result<String, Error>;

trait JsonExt {
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

#[napi(object)]
pub struct AccessTokenCreds {
  pub author_name: String,
  pub author_email: String,
  pub access_token: String,
}

#[napi(object, use_nullable = true)]
pub struct CloneOptions {
  pub branch: Option<String>,
  pub depth: Option<i32>,
  pub url: String,
  pub to: String,
}

impl From<CloneOptions> for gramaxgit::actions::clone::CloneOptions {
  fn from(val: CloneOptions) -> Self {
    gramaxgit::actions::clone::CloneOptions {
      branch: val.branch,
      depth: val.depth,
      url: val.url,
      to: val.to.into(),
    }
  }
}

impl From<AccessTokenCreds> for gramaxgit::creds::AccessTokenCreds {
  fn from(val: AccessTokenCreds) -> Self {
    gramaxgit::creds::AccessTokenCreds::new(&val.author_name, &val.author_email, &val.access_token)
  }
}

#[napi(js_name = "init_new")]
pub fn init_new(path: String, creds: AccessTokenCreds) -> Output {
  git::init_new(Path::new(&path), creds.into()).json()
}

#[napi]
pub fn clone(env: Env, creds: AccessTokenCreds, opts: CloneOptions, callback: JsFunction) -> Output {
  git::clone(
    creds.into(),
    opts.into(),
    Box::new(move |val| {
      if let Ok(val) = serde_json::to_string(&val) {
        _ = callback.call(None, &[env.create_string(&val).unwrap()]);
      }
    }),
  )
  .json()
}

#[napi]
pub fn status(repo_path: String) -> Output {
  git::status(Path::new(&repo_path)).json()
}

#[napi(js_name = "status_file")]
pub fn status_file(repo_path: String, path: String) -> Output {
  git::status_file(Path::new(&repo_path), Path::new(&path)).json()
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
pub fn fetch(repo_path: String, creds: AccessTokenCreds) -> Output {
  git::fetch(Path::new(&repo_path), creds.into()).json()
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
pub fn add(repo_path: String, paths: Vec<String>) -> Output {
  let paths: Vec<std::path::PathBuf> = paths.into_iter().map(std::path::PathBuf::from).collect();
  git::add(Path::new(&repo_path), paths).json()
}

#[napi]
pub fn commit(
  repo_path: String,
  creds: AccessTokenCreds,
  message: String,
  parents: Option<Vec<String>>,
) -> Output {
  git::commit(Path::new(&repo_path), creds.into(), &message, parents).json()
}

#[napi]
pub fn diff(repo_path: String, old_oid: String, new_oid: String) -> Output {
  git::diff(Path::new(&repo_path), &old_oid, &new_oid).json()
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
