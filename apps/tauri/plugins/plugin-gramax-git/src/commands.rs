use gramaxgit::actions::merge::MergeResult;
use gramaxgit::commands::TreeReadScope;
use gramaxgit::creds::*;
use tauri::*;
use tauri_otel_context::OtelContext;

use gramaxgit::commands as git;
use gramaxgit::prelude::*;

use gramaxgit::commands::Result;

use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;

#[command]
pub(crate) fn is_init(_otel: OtelContext, repo_path: &Path) -> Result<bool> {
	git::is_init(repo_path)
}

#[command]
pub(crate) fn is_bare(_otel: OtelContext, repo_path: &Path) -> Result<bool> {
	git::is_bare(repo_path)
}

#[command(async)]
pub(crate) fn file_history(_otel: OtelContext, repo_path: &Path, file_path: &Path, offset: usize, limit: usize) -> Result<HistoryInfo> {
	git::file_history(repo_path, file_path, offset, limit)
}

#[command(async)]
pub(crate) fn branch_info(_otel: OtelContext, repo_path: &Path, name: Option<&str>) -> Result<BranchInfo> {
	git::branch_info(repo_path, name)
}

#[command(async)]
pub(crate) fn branch_list(_otel: OtelContext, repo_path: &Path) -> Result<Vec<BranchInfo>> {
	git::branch_list(repo_path)
}

#[command(async)]
pub(crate) fn default_branch(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds) -> Result<Option<BranchInfo>> {
	git::default_branch(repo_path, creds)
}

#[command(async)]
pub(crate) fn fetch(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds, opts: RemoteOptions, lock: bool) -> Result<()> {
	git::fetch(repo_path, creds, opts, lock)
}

#[command(async)]
pub(crate) fn set_head(_otel: OtelContext, repo_path: &Path, refname: &str) -> Result<()> {
	git::set_head(repo_path, refname)
}

#[command(async)]
pub(crate) fn new_branch(_otel: OtelContext, repo_path: &Path, name: &str) -> Result<()> {
	git::new_branch(repo_path, name)
}

#[command(async)]
pub(crate) fn delete_branch(_otel: OtelContext, repo_path: &Path, name: &str, remote: bool, creds: Option<AccessTokenCreds>) -> Result<()> {
	git::delete_branch(repo_path, name, remote, creds)
}

#[command(async)]
pub(crate) fn add_remote(_otel: OtelContext, repo_path: &Path, name: &str, url: &str) -> Result<()> {
	git::add_remote(repo_path, name, url)
}

#[command(async)]
pub(crate) fn has_remotes(_otel: OtelContext, repo_path: &Path) -> Result<bool> {
	git::has_remotes(repo_path)
}

#[command(async)]
pub(crate) fn status(_otel: OtelContext, repo_path: &Path, index: bool) -> Result<StatusInfo> {
	git::status(repo_path, index)
}

#[command(async)]
pub(crate) fn status_file(_otel: OtelContext, repo_path: &Path, file_path: &Path) -> Result<StatusEntry> {
	git::status_file(repo_path, file_path)
}

#[command(async)]
pub(crate) fn push(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
	git::push(repo_path, creds)
}

#[command(async)]
pub(crate) fn init_new(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds) -> Result<()> {
	git::init_new(repo_path, creds)
}

#[command(async)]
pub(crate) fn checkout(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds, ref_name: &str, force: bool) -> Result<()> {
	git::checkout(repo_path, creds, ref_name, force)
}

#[command(async)]
pub(crate) fn clone<R: Runtime>(_otel: OtelContext, window: Window<R>, creds: AccessTokenCreds, opts: CloneOptions) -> Result<()> {
	git::clone(creds, opts, Rc::new(move |chunk| _ = window.emit("remote-progress", chunk)))?;
	Ok(())
}

#[command(async)]
pub(crate) fn recover<R: Runtime>(
	_otel: OtelContext,
	window: Window<R>,
	repo_path: &Path,
	creds: AccessTokenCreds,
	cancel_token: usize,
) -> Result<()> {
	git::recover(
		repo_path,
		creds,
		cancel_token.into(),
		Rc::new(move |chunk| _ = window.emit("remote-progress", chunk)),
	)?;
	Ok(())
}

#[command]
pub(crate) fn cancel(_otel: OtelContext, id: usize) -> Result<bool> {
	git::cancel(id)
}

#[command(async)]
pub(crate) fn add(_otel: OtelContext, repo_path: &Path, patterns: Vec<PathBuf>, force: bool) -> Result<()> {
	git::add(repo_path, patterns, force)
}

#[command(async)]
pub(crate) fn diff(_otel: OtelContext, repo_path: &Path, opts: DiffConfig) -> Result<DiffTree2TreeInfo> {
	git::diff(repo_path, opts)
}

#[command(async)]
pub(crate) fn reset(_otel: OtelContext, repo_path: &Path, opts: ResetOptions) -> Result<()> {
	git::reset(repo_path, opts)
}

#[command(async)]
pub(crate) fn commit(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds, opts: CommitOptions) -> Result<()> {
	git::commit(repo_path, creds, opts)
}

#[command(async)]
pub(crate) fn count_changed_files(_otel: OtelContext, repo_path: &Path, search_in: &Path) -> Result<UpstreamCountChangedFiles> {
	git::count_changed_files(Path::new(&repo_path), search_in)
}

#[command(async)]
pub(crate) fn merge(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds, opts: MergeOptions) -> Result<MergeResult> {
	git::merge(repo_path, creds, opts)
}

#[command(async)]
pub(crate) fn get_content(_otel: OtelContext, repo_path: &Path, path: &Path, oid: Option<&str>) -> Result<String> {
	git::get_content(repo_path, path, oid)
}

#[command(async)]
pub(crate) fn get_commit_info(_otel: OtelContext, repo_path: &Path, oid: &str, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>> {
	git::get_commit_info(repo_path, oid, opts)
}

#[command(async)]
pub(crate) fn get_parent(_otel: OtelContext, repo_path: &Path, oid: &str) -> Result<Option<String>> {
	git::get_parent(repo_path, oid)
}

#[command(async)]
pub(crate) fn restore(_otel: OtelContext, repo_path: &Path, staged: bool, paths: Vec<PathBuf>) -> Result<()> {
	git::restore(repo_path, staged, paths)
}

#[command(async)]
pub(crate) fn get_remote(_otel: OtelContext, repo_path: &Path) -> Result<Option<String>> {
	git::get_remote(repo_path)
}

#[command(async)]
pub(crate) fn stash(_otel: OtelContext, repo_path: &Path, message: Option<&str>, creds: AccessTokenCreds) -> Result<Option<String>> {
	git::stash(repo_path, message, creds)
}

#[command(async)]
pub(crate) fn stash_apply(_otel: OtelContext, repo_path: &Path, oid: &str) -> Result<MergeResult> {
	git::stash_apply(repo_path, oid)
}

#[command(async)]
pub(crate) fn stash_delete(_otel: OtelContext, repo_path: &Path, oid: &str) -> Result<()> {
	git::stash_delete(repo_path, oid)
}

#[command(async)]
pub(crate) fn git_read_dir(_otel: OtelContext, repo_path: &Path, path: &Path, scope: TreeReadScope) -> Result<Vec<DirEntry>> {
	git::read_dir(repo_path, scope, path)
}

#[command(async)]
pub(crate) fn git_file_stat(_otel: OtelContext, repo_path: &Path, path: &Path, scope: TreeReadScope) -> Result<Stat> {
	git::file_stat(repo_path, scope, path)
}

#[command(async)]
pub(crate) fn git_file_exists(_otel: OtelContext, repo_path: &Path, path: &Path, scope: TreeReadScope) -> Result<bool> {
	git::file_exists(repo_path, scope, path)
}

#[command(async)]
pub(crate) fn git_read_dir_stats(_otel: OtelContext, repo_path: &Path, path: &Path, scope: TreeReadScope) -> Result<Vec<DirStat>> {
	git::read_dir_stats(repo_path, scope, path)
}

#[command(async)]
pub(crate) fn find_refs_by_globs(_otel: OtelContext, repo_path: &Path, patterns: Vec<String>) -> Result<Vec<RefInfo>> {
	git::find_refs_by_globs(repo_path, &patterns)
}

#[command(async)]
pub(crate) fn list_merge_requests(_otel: OtelContext, repo_path: &Path) -> Result<Vec<MergeRequest>> {
	git::list_merge_requests(repo_path)
}

#[command(async)]
pub(crate) fn create_or_update_merge_request(
	_otel: OtelContext,
	repo_path: &Path,
	creds: AccessTokenCreds,
	merge_request: CreateMergeRequest,
) -> Result<()> {
	git::create_or_update_merge_request(repo_path, merge_request, creds)
}

#[command(async)]
pub(crate) fn get_draft_merge_request(_otel: OtelContext, repo_path: &Path) -> Result<Option<MergeRequest>> {
	git::get_draft_merge_request(repo_path)
}

#[command(async)]
pub(crate) fn get_all_commit_authors(_otel: OtelContext, repo_path: &Path) -> Result<Vec<CommitAuthorInfo>> {
	git::get_all_commit_authors(repo_path)
}

#[command(async)]
pub(crate) fn pull_lfs_objects(
	_otel: OtelContext,
	repo_path: &Path,
	creds: AccessTokenCreds,
	paths: Vec<PathBuf>,
	checkout: bool,
	cancel_token: usize,
) -> Result<()> {
	git::pull_lfs_objects(repo_path, creds, paths, checkout, cancel_token.into())
}

#[command(async)]
pub(crate) fn gc(_otel: OtelContext, repo_path: &Path, opts: GcOptions) -> Result<()> {
	git::gc(repo_path, opts)
}

#[command]
pub(crate) fn get_all_cancel_tokens(_otel: OtelContext) -> Result<Vec<usize>> {
	git::get_all_cancel_tokens()
}

#[command]
pub(crate) fn healthcheck(_otel: OtelContext, repo_path: &Path) -> Result<()> {
	git::healthcheck(repo_path)?;
	Ok(())
}

#[command]
pub(crate) fn get_config_val(_otel: OtelContext, repo_path: &Path, name: &str) -> Result<Option<String>> {
	git::get_config_val(repo_path, name)
}

#[command]
pub(crate) fn set_config_val(_otel: OtelContext, repo_path: &Path, name: &str, val: gramaxgit::ConfigValue) -> Result<()> {
	git::set_config_val(repo_path, name, val)
}

#[command]
pub(crate) fn reset_repo(_otel: OtelContext) -> Result<bool> {
	git::reset_repo();
	Ok(true)
}

#[command]
pub(crate) fn reset_file_lock(_otel: OtelContext, repo_path: &Path) -> Result<bool> {
	git::reset_file_lock(repo_path);
	Ok(true)
}

#[command(async)]
pub(crate) fn format_merge_message(_otel: OtelContext, repo_path: &Path, creds: AccessTokenCreds, opts: MergeMessageFormatOptions) -> Result<String> {
	git::format_merge_message(repo_path, creds, opts)
}
