use std::ffi::CString;
use std::path::Path;
use std::path::PathBuf;

use gramaxgit::commands as git;
use gramaxgit::commands::Result;
use gramaxgit::commands::TreeReadScope;
use gramaxgit::creds::AccessTokenCreds;
use gramaxgit::prelude::*;

use em_bindgen_macro::em_bindgen;

use crate::emscripten_run_script;
use crate::git_http_error;
use crate::git_http_error::OrHttpError;

pub const TAG: &str = "git:wasm";

fn register_clone_cancel_token(token: usize) {
  unsafe {
    let script = format!("self.cancelToken = {}", token);
    let script_cstr = CString::new(script).unwrap().into_raw() as *const u8;
    emscripten_run_script(script_cstr);
  }
}

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

#[em_bindgen(json)]
pub fn is_init(repo_path: String) -> Result<bool> {
  git::is_init(Path::new(&repo_path))
}

#[em_bindgen(json)]
pub fn is_bare(repo_path: String) -> Result<bool> {
  git::is_bare(Path::new(&repo_path))
}

#[em_bindgen(json)]
pub fn default_branch(repo_path: String, creds: AccessTokenCreds) -> Result<Option<BranchInfo>> {
  git::default_branch(Path::new(&repo_path), creds).or_http_error()
}

#[em_bindgen(json)]
pub fn format_merge_message(
  repo_path: String,
  creds: AccessTokenCreds,
  opts: MergeMessageFormatOptions,
) -> Result<String> {
  git::format_merge_message(Path::new(&repo_path), creds, opts)
}

#[em_bindgen]
pub fn set_head(repo_path: String, refname: String) -> Result<()> {
  git::set_head(Path::new(&repo_path), &refname)
}

#[em_bindgen]
pub fn init_new(repo_path: String, creds: AccessTokenCreds) -> Result<()> {
  git::init_new(Path::new(&repo_path), creds)
}

#[em_bindgen(json)]
pub fn file_history(repo_path: String, file_path: String, count: usize) -> Result<HistoryInfo> {
  git::file_history(Path::new(&repo_path), Path::new(&file_path), count)
}

#[em_bindgen(json)]
pub fn get_commit_info(repo_path: String, oid: String, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>> {
  git::get_commit_info(Path::new(&repo_path), &oid, opts)
}

#[em_bindgen(json)]
pub fn branch_info(repo_path: String, name: Option<String>) -> Result<BranchInfo> {
  git::branch_info(Path::new(&repo_path), name.as_deref())
}

#[em_bindgen(json)]
pub fn branch_list(repo_path: String) -> Result<Vec<BranchInfo>> {
  git::branch_list(Path::new(&repo_path))
}

#[em_bindgen]
pub fn new_branch(repo_path: String, name: String) -> Result<()> {
  git::new_branch(Path::new(&repo_path), &name)
}

#[em_bindgen]
pub fn delete_branch(
  repo_path: String,
  name: String,
  remote: bool,
  creds: Option<AccessTokenCreds>,
) -> Result<()> {
  git::delete_branch(Path::new(&repo_path), &name, remote, creds)
}

#[em_bindgen]
pub fn add_remote(repo_path: String, name: String, url: String) -> Result<()> {
  git::add_remote(Path::new(&repo_path), &name, &url)
}

#[em_bindgen(json)]
pub fn has_remotes(repo_path: String) -> Result<bool> {
  git::has_remotes(Path::new(&repo_path))
}

#[em_bindgen(json)]
pub fn status(repo_path: String, index: bool) -> Result<StatusInfo> {
  git::status(Path::new(&repo_path), index)
}

#[em_bindgen(json)]
pub fn status_file(repo_path: String, file_path: String) -> Result<StatusEntry> {
  git::status_file(Path::new(&repo_path), Path::new(&file_path))
}

#[em_bindgen]
pub fn push(repo_path: String, creds: AccessTokenCreds) -> Result<()> {
  git::push(Path::new(&repo_path), creds).or_http_error()
}

#[em_bindgen]
pub fn checkout(repo_path: String, ref_name: String, force: bool) -> Result<()> {
  git::checkout(Path::new(&repo_path), &ref_name, force)
}

#[em_bindgen]
pub fn fetch(repo_path: String, creds: AccessTokenCreds, force: bool) -> Result<()> {
  git::fetch(Path::new(&repo_path), creds, force).or_http_error()
}

#[em_bindgen]
pub fn clone(creds: AccessTokenCreds, opts: CloneOptions) -> Result<()> {
  register_clone_cancel_token(opts.cancel_token);
  git::clone(creds, opts, Box::new(on_clone_progress)).or_http_error()
}

#[em_bindgen(json)]
pub fn clone_cancel(id: usize) -> Result<bool> {
  git::clone_cancel(id)
}

#[em_bindgen(json)]
pub fn get_all_cancel_tokens() -> Result<Vec<usize>> {
  git::get_all_cancel_tokens()
}

#[em_bindgen]
pub fn add(repo_path: String, patterns: Vec<PathBuf>, force: bool) -> Result<()> {
  git::add(Path::new(&repo_path), patterns, force)
}

#[em_bindgen(json)]
pub fn diff(repo_path: String, opts: DiffConfig) -> Result<DiffTree2TreeInfo> {
  git::diff(Path::new(&repo_path), opts)
}

#[em_bindgen]
pub fn reset(repo_path: String, opts: ResetOptions) -> Result<()> {
  git::reset(Path::new(&repo_path), opts)
}

#[em_bindgen]
pub fn commit(repo_path: String, creds: AccessTokenCreds, opts: CommitOptions) -> Result<()> {
  git::commit(Path::new(&repo_path), creds, opts)
}

#[em_bindgen(json)]
pub fn merge(repo_path: String, creds: AccessTokenCreds, opts: MergeOptions) -> Result<MergeResult> {
  git::merge(Path::new(&repo_path), creds, opts)
}

#[em_bindgen(json)]
pub fn graph_head_upstream_files(repo_path: String, search_in: String) -> Result<UpstreamCountChangedFiles> {
  git::graph_head_upstream_files(Path::new(&repo_path), Path::new(&search_in))
}

#[em_bindgen(json)]
pub fn get_content(repo_path: String, path: String, oid: Option<String>) -> Result<String> {
  git::get_content(Path::new(&repo_path), Path::new(&path), oid.as_deref())
}

#[em_bindgen(json)]
pub fn get_parent(repo_path: String, oid: String) -> Result<Option<String>> {
  git::get_parent(Path::new(&repo_path), &oid)
}

#[em_bindgen]
pub fn restore(repo_path: String, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
  git::restore(Path::new(&repo_path), staged, paths)
}

#[em_bindgen(json)]
pub fn get_remote(repo_path: String) -> Result<Option<String>> {
  git::get_remote(Path::new(&repo_path))
}

#[em_bindgen(json)]
pub fn stash(repo_path: String, message: Option<String>, creds: AccessTokenCreds) -> Result<Option<String>> {
  git::stash(Path::new(&repo_path), message.as_deref(), creds)
}

#[em_bindgen(json)]
pub fn stash_apply(repo_path: String, oid: String) -> Result<MergeResult> {
  git::stash_apply(Path::new(&repo_path), &oid)
}

#[em_bindgen]
pub fn stash_delete(repo_path: String, oid: String) -> Result<()> {
  git::stash_delete(Path::new(&repo_path), &oid)
}

#[em_bindgen(json)]
pub fn find_refs_by_globs(repo_path: String, patterns: Vec<String>) -> Result<Vec<RefInfo>> {
  git::find_refs_by_globs(Path::new(&repo_path), &patterns)
}

#[em_bindgen(json)]
pub fn git_read_dir(repo_path: String, path: String, scope: TreeReadScope) -> Result<Vec<DirEntry>> {
  git::read_dir(Path::new(&repo_path), scope, Path::new(&path))
}

#[em_bindgen(json)]
pub fn git_file_stat(repo_path: String, path: String, scope: TreeReadScope) -> Result<Stat> {
  git::file_stat(Path::new(&repo_path), scope, Path::new(&path))
}

#[em_bindgen(json)]
pub fn git_read_dir_stats(repo_path: String, path: String, scope: TreeReadScope) -> Result<Vec<DirStat>> {
  git::read_dir_stats(Path::new(&repo_path), scope, Path::new(&path))
}

#[em_bindgen(json)]
pub fn git_file_exists(repo_path: String, path: String, scope: TreeReadScope) -> Result<bool> {
  git::file_exists(Path::new(&repo_path), scope, Path::new(&path))
}

#[em_bindgen(bytes)]
pub fn git_read_file(repo_path: String, path: String, scope: TreeReadScope) -> Result<Vec<u8>> {
  git::read_file(Path::new(&repo_path), scope, Path::new(&path))
}

#[em_bindgen(json)]
pub fn list_merge_requests(repo_path: String) -> Result<Vec<MergeRequest>> {
  git::list_merge_requests(Path::new(&repo_path))
}

#[em_bindgen]
pub fn create_or_update_merge_request(
  repo_path: String,
  creds: AccessTokenCreds,
  merge_request: CreateMergeRequest,
) -> Result<()> {
  git::create_or_update_merge_request(Path::new(&repo_path), merge_request, creds)
}

#[em_bindgen(json)]
pub fn get_draft_merge_request(repo_path: String) -> Result<Option<MergeRequest>> {
  git::get_draft_merge_request(Path::new(&repo_path))
}

#[em_bindgen(json)]
pub fn get_all_commit_authors(repo_path: String) -> Result<Vec<CommitAuthorInfo>> {
  git::get_all_commit_authors(Path::new(&repo_path))
}

#[em_bindgen]
pub fn gc(repo_path: String, opts: GcOptions) -> Result<()> {
  git::gc(Path::new(&repo_path), opts)
}

#[em_bindgen(json)]
pub fn reset_repo(_unused: ()) -> Result<bool> {
  git_http_error::take_last_http_error();
  git::reset_repo();
  Ok(true)
}
