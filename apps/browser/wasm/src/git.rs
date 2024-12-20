use std::ffi::CString;
use std::path::Path;
use std::path::PathBuf;

use gramaxgit::commands as git;
use gramaxgit::commands::Result;
use gramaxgit::commands::TreeReadScope;
use gramaxgit::creds::AccessTokenCreds;
use gramaxgit::prelude::*;

use crate::define_c_api;
use crate::emscripten_run_script;

fn on_clone_progress(progress: CloneProgress) {
  unsafe {
    let script = format!(
      "self.postMessage({{ type: 'clone-progress', progress: {} }})",
      serde_json::to_string(&progress).unwrap()
    );
    let script_cstr = CString::new(script).unwrap().into_raw() as *const u8;
    emscripten_run_script(script_cstr);
  }
}

define_c_api! {
  json fn is_init(repo_path: String) -> bool {
    git::is_init(Path::new(&repo_path))
  }

  json fn is_bare(repo_path: String) -> bool {
    git::is_bare(Path::new(&repo_path))
  }

  noreturn fn set_head(repo_path: String, refname: String) -> () {
    git::set_head(Path::new(&repo_path), &refname)
  }

  noreturn fn init_new(repo_path: String, creds: AccessTokenCreds) -> () {
    git::init_new(Path::new(&repo_path), creds)
  }

  json fn file_history(repo_path: String, file_path: String, count: usize) -> HistoryInfo {
    git::file_history(Path::new(&repo_path), Path::new(&file_path), count)
  }

  json fn branch_info(repo_path: String, name: Option<String>) -> BranchInfo {
    git::branch_info(Path::new(&repo_path), name.as_deref())
  }

  json fn branch_list(repo_path: String) -> Vec<BranchInfo> {
    git::branch_list(Path::new(&repo_path))
  }

  noreturn fn new_branch(repo_path: String, name: String) -> () {
    git::new_branch(Path::new(&repo_path), &name)
  }

  noreturn fn delete_branch(repo_path: String, name: String, remote: bool, creds: Option<AccessTokenCreds>) -> () {
    git::delete_branch(Path::new(&repo_path), &name, remote, creds)
  }

  noreturn fn add_remote(repo_path: String, name: String, url: String) -> () {
    git::add_remote(Path::new(&repo_path), &name, &url)
  }

  json fn has_remotes(repo_path: String) -> bool {
    git::has_remotes(Path::new(&repo_path))
  }

  json fn status(repo_path: String) -> StatusInfo {
    git::status(Path::new(&repo_path))
  }

  json fn status_file(repo_path: String, file_path: String) -> StatusEntry {
    git::status_file(Path::new(&repo_path), Path::new(&file_path))
  }

  noreturn fn push(repo_path: String, creds: AccessTokenCreds) -> () {
    git::push(Path::new(&repo_path), creds)
  }

  noreturn fn checkout(repo_path: String, ref_name: String, force: bool) -> () {
    git::checkout(Path::new(&repo_path), &ref_name, force)
  }

  noreturn fn fetch(repo_path: String, creds: AccessTokenCreds, force: bool) -> () {
    git::fetch(Path::new(&repo_path), creds, force)
  }

  noreturn fn clone(creds: AccessTokenCreds, opts: CloneOptions) -> () {
    git::clone(creds, opts, Box::new(on_clone_progress))
  }

  noreturn fn add(repo_path: String, patterns: Vec<PathBuf>) -> () {
    git::add(Path::new(&repo_path), patterns)
  }

  json fn diff(repo_path: String, old: String, new: String) -> StatusInfo {
    git::diff(Path::new(&repo_path), &old, &new)
  }

  noreturn fn reset_all(repo_path: String, hard: bool, head: Option<String>) -> () {
    git::reset_all(Path::new(&repo_path), hard, head.as_deref())
  }

  noreturn fn commit(repo_path: String, creds: AccessTokenCreds, message: String, parents: Option<Vec<String>>) -> () {
    git::commit(Path::new(&repo_path), creds, &message, parents)
  }

  json fn merge(repo_path: String, creds: AccessTokenCreds, theirs: String) -> MergeResult {
    git::merge(Path::new(&repo_path), creds, &theirs)
  }

  json fn graph_head_upstream_files(repo_path: String, search_in: String) -> UpstreamCountChangedFiles {
    git::graph_head_upstream_files(Path::new(&repo_path), Path::new(&search_in))
  }

  json fn get_content(repo_path: String, path: String, oid: Option<String>) -> String {
    git::get_content(Path::new(&repo_path), Path::new(&path), oid.as_deref())
  }

  json fn get_parent(repo_path: String, oid: String) -> Option<String> {
    git::get_parent(Path::new(&repo_path), &oid)
  }

  noreturn fn restore(repo_path: String, staged: bool, paths: Vec<PathBuf>) -> () {
    git::restore(Path::new(&repo_path), staged, paths)
  }

  json fn get_remote(repo_path: String) -> Option<String> {
    git::get_remote(Path::new(&repo_path))
  }

  json fn stash(repo_path: String, message: Option<String>, creds: AccessTokenCreds) -> Option<String> {
    git::stash(Path::new(&repo_path), message.as_deref(), creds)
  }

  json fn stash_apply(repo_path: String, oid: String) -> MergeResult {
    git::stash_apply(Path::new(&repo_path), &oid)
  }

  noreturn fn stash_delete(repo_path: String, oid: String) -> () {
    git::stash_delete(Path::new(&repo_path), &oid)
  }

  json fn find_refs_by_globs(repo_path: String, patterns: Vec<String>) -> Vec<RefInfo> {
    git::find_refs_by_globs(Path::new(&repo_path), &patterns)
  }

  json fn git_read_dir(repo_path: String, path: String, scope: TreeReadScope) -> Vec<DirEntry> {
    git::read_dir(Path::new(&repo_path), scope, Path::new(&path))
  }

  json fn git_file_stat(repo_path: String, path: String, scope: TreeReadScope) -> Stat {
    git::file_stat(Path::new(&repo_path), scope, Path::new(&path))
  }

  json fn git_read_dir_stats(repo_path: String, path: String, scope: TreeReadScope) -> Vec<DirStat> {
    git::read_dir_stats(Path::new(&repo_path), scope, Path::new(&path))
  }

  json fn git_file_exists(repo_path: String, path: String, scope: TreeReadScope) -> bool {
    git::file_exists(Path::new(&repo_path), scope, Path::new(&path))
  }

  bytes fn git_read_file(repo_path: String, path: String, scope: TreeReadScope) -> Vec<u8> {
    git::read_file(Path::new(&repo_path), scope, Path::new(&path))
  }

  json fn list_merge_requests(repo_path: String) -> Vec<MergeRequest> {
    git::list_merge_requests(Path::new(&repo_path))
  }

  noreturn fn create_or_update_merge_request(repo_path: String, creds: AccessTokenCreds, merge_request: CreateMergeRequest) -> () {
    git::create_or_update_merge_request(Path::new(&repo_path), merge_request, creds)
  }

  json fn get_draft_merge_request(repo_path: String) -> Option<MergeRequest> {
    git::get_draft_merge_request(Path::new(&repo_path))
  }

  noreturn fn invalidate_repo_cache(repo_paths: Vec<String>) -> () {
    git::invalidate_repo_cache(repo_paths.into_iter().map(PathBuf::from).collect())
  }
}
