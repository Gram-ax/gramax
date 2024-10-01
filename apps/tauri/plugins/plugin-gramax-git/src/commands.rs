use gramaxgit::actions::merge::MergeResult;
use gramaxgit::creds::*;
use tauri::*;

use gramaxgit::commands as git;
use gramaxgit::prelude::*;

use gramaxgit::commands::Result;

use std::path::Path;
use std::path::PathBuf;

#[command(async)]
pub(crate) fn file_history(repo_path: &Path, file_path: &Path, count: usize) -> Result<HistoryInfo> {
  git::file_history(repo_path, file_path, count)
}

#[command(async)]
pub(crate) fn branch_info(repo_path: &Path, name: Option<&str>) -> Result<BranchInfo> {
  git::branch_info(repo_path, name)
}

#[command(async)]
pub(crate) fn branch_list(repo_path: &Path) -> Result<Vec<BranchInfo>> {
  git::branch_list(repo_path)
}

#[command(async)]
pub(crate) fn fetch(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  git::fetch(repo_path, creds)
}

#[command(async)]
pub(crate) fn new_branch(repo_path: &Path, name: &str) -> Result<()> {
  git::new_branch(repo_path, name)
}

#[command(async)]
pub(crate) fn delete_branch(
  repo_path: &Path,
  name: &str,
  remote: bool,
  creds: Option<AccessTokenCreds>,
) -> Result<()> {
  git::delete_branch(repo_path, name, remote, creds)
}

#[command(async)]
pub(crate) fn add_remote(repo_path: &Path, name: &str, url: &str) -> Result<()> {
  git::add_remote(repo_path, name, url)
}

#[command(async)]
pub(crate) fn has_remotes(repo_path: &Path) -> Result<bool> {
  git::has_remotes(repo_path)
}

#[command(async)]
pub(crate) fn status(repo_path: &Path) -> Result<StatusInfo> {
  git::status(repo_path)
}

#[command(async)]
pub(crate) fn status_file(repo_path: &Path, file_path: &Path) -> Result<StatusEntry> {
  git::status_file(repo_path, file_path)
}

#[command(async)]
pub(crate) fn push(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  git::push(repo_path, creds)
}

#[command(async)]
pub(crate) fn init_new(repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
  git::init_new(repo_path, creds)
}

#[command(async)]
pub(crate) fn checkout(repo_path: &Path, ref_name: &str, force: bool) -> Result<()> {
  git::checkout(repo_path, ref_name, force)
}

#[command(async)]
pub(crate) fn clone<R: Runtime>(
  window: Window<R>,
  creds: AccessTokenCreds,
  opts: CloneOptions,
) -> Result<()> {
  git::clone(creds, opts, Box::new(move |chunk| _ = window.emit("clone-progress", chunk)))
}

#[command(async)]
pub(crate) fn add(repo_path: &Path, patterns: Vec<PathBuf>) -> Result<()> {
  git::add(repo_path, patterns)
}

#[command(async)]
pub(crate) fn diff(repo_path: &Path, old: &str, new: &str) -> Result<StatusInfo> {
  git::diff(repo_path, old, new)
}

#[command(async)]
pub(crate) fn reset_all(repo_path: &Path, hard: bool, head: Option<&str>) -> Result<()> {
  git::reset_all(repo_path, hard, head)
}

#[command(async)]
pub(crate) fn commit(
  repo_path: &Path,
  creds: AccessTokenCreds,
  message: &str,
  parents: Option<Vec<String>>,
) -> Result<()> {
  git::commit(repo_path, creds, message, parents)
}

#[command(async)]
pub(crate) fn graph_head_upstream_files(
  repo_path: &Path,
  search_in: &Path,
) -> Result<UpstreamCountChangedFiles> {
  git::graph_head_upstream_files(Path::new(&repo_path), search_in)
}

#[command(async)]
pub(crate) fn merge(repo_path: &Path, creds: AccessTokenCreds, theirs: &str) -> Result<MergeResult> {
  git::merge(repo_path, creds, theirs)
}

#[command(async)]
pub(crate) fn get_content(repo_path: &Path, path: &Path, oid: Option<&str>) -> Result<String> {
  git::get_content(repo_path, path, oid)
}

#[command(async)]
pub(crate) fn get_parent(repo_path: &Path, oid: &str) -> Result<Option<String>> {
  git::get_parent(repo_path, oid)
}

#[command(async)]
pub(crate) fn restore(repo_path: &Path, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
  git::restore(repo_path, staged, paths)
}

#[command(async)]
pub(crate) fn get_remote(repo_path: &Path) -> Result<Option<String>> {
  git::get_remote(repo_path)
}

#[command(async)]
pub(crate) fn stash(
  repo_path: &Path,
  message: Option<&str>,
  creds: AccessTokenCreds,
) -> Result<Option<String>> {
  git::stash(repo_path, message, creds)
}

#[command(async)]
pub(crate) fn stash_apply(repo_path: &Path, oid: &str) -> Result<MergeResult> {
  git::stash_apply(repo_path, oid)
}

#[command(async)]
pub(crate) fn stash_delete(repo_path: &Path, oid: &str) -> Result<()> {
  git::stash_delete(repo_path, oid)
}
