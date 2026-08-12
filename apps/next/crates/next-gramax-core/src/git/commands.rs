use std::path::Path;
use std::path::PathBuf;
use std::rc::Rc;

use napi::threadsafe_function::*;
use napi::Error;

use gramaxgit::commands as git;
use gramaxgit::prelude::CreateMergeRequest;
use gramaxgit::prelude::DiffConfig;

use napi_async_macro::napi_async;

use super::dto::*;

#[napi_async]
pub fn is_init(repo_path: String) -> Output {
	git::is_init(Path::new(&repo_path))
}

#[napi_async]
pub fn is_bare(repo_path: String) -> Output {
	git::is_bare(Path::new(&repo_path))
}

#[napi_async]
pub async fn init_new(path: String, creds: AccessTokenCreds) -> Output {
	git::init_new(Path::new(&path), creds.into())
}

#[napi_async]
pub fn format_merge_message(repo_path: String, creds: AccessTokenCreds, opts: MergeMessageFormatOptions) -> Output {
	git::format_merge_message(Path::new(&repo_path), creds.into(), opts.into())
}

#[napi_async]
pub async fn clone(creds: AccessTokenCreds, opts: RawCloneOptions, callback: ThreadsafeFunction<String>) -> Output {
	git::clone(
		creds.clone().into(),
		opts.clone().into(),
		Rc::new(|val| {
			if let Ok(val) = serde_json::to_string(&val) {
				callback.call(Ok(val), ThreadsafeFunctionCallMode::Blocking);
			}
		}),
	)
}

#[napi_async]
pub fn cancel(id: i32) -> Output {
	git::cancel(id as usize)
}

#[napi_async]
pub fn status(repo_path: String, index: bool) -> Output {
	git::status(Path::new(&repo_path), index)
}

#[napi_async]
pub fn status_file(repo_path: String, path: String) -> Output {
	git::status_file(Path::new(&repo_path), Path::new(&path))
}

#[napi_async]
pub fn get_all_commit_authors(repo_path: String) -> Output {
	git::get_all_commit_authors(Path::new(&repo_path))
}

#[napi_async]
pub fn default_branch(repo_path: String, creds: AccessTokenCreds) -> Output {
	git::default_branch(Path::new(&repo_path), creds.into())
}

#[napi_async]
pub fn branch_list(repo_path: String) -> Output {
	git::branch_list(Path::new(&repo_path))
}

#[napi_async]
pub fn branch_info(repo_path: String, name: Option<String>) -> Output {
	git::branch_info(Path::new(&repo_path), name.as_deref())
}

#[napi_async]
pub fn new_branch(repo_path: String, name: String) -> Output {
	git::new_branch(Path::new(&repo_path), &name)
}

#[napi_async]
pub fn delete_branch(repo_path: String, name: String, remote: bool, creds: Option<AccessTokenCreds>) -> Output {
	let creds = creds.map(|c| c.into());
	git::delete_branch(Path::new(&repo_path), &name, remote, creds)
}

#[napi_async]
pub fn set_head(repo_path: String, refname: String) -> Output {
	git::set_head(Path::new(&repo_path), &refname)
}

#[napi_async]
pub async fn checkout(repo_path: String, creds: AccessTokenCreds, branch: String, create: bool) -> Output {
	git::checkout(Path::new(&repo_path), creds.into(), &branch, create)
}

#[napi_async]
pub fn add_remote(repo_path: String, name: String, url: String) -> Output {
	git::add_remote(Path::new(&repo_path), &name, &url)
}

#[napi_async]
pub fn has_remotes(repo_path: String) -> Output {
	git::has_remotes(Path::new(&repo_path))
}

#[napi_async]
pub fn get_remote(repo_path: String) -> Output {
	git::get_remote(Path::new(&repo_path))
}

#[napi_async]
pub async fn fetch(repo_path: String, creds: AccessTokenCreds, opts: RemoteOptions, lock: bool) -> Output {
	git::fetch(Path::new(&repo_path), creds.into(), opts.into(), lock)
}

#[napi_async]
pub async fn push(repo_path: String, creds: AccessTokenCreds) -> Output {
	git::push(Path::new(&repo_path), creds.clone().into())
}

#[napi_async]
pub fn file_history(repo_path: String, file_path: String, offset: u32, limit: u32) -> Output {
	git::file_history(Path::new(&repo_path), Path::new(&file_path), offset as usize, limit as usize)
}

#[napi_async]
pub fn get_commit_info(repo_path: String, oid: String, opts: CommitInfoOpts) -> Output {
	git::get_commit_info(Path::new(&repo_path), &oid, opts.into())
}

#[napi_async]
pub fn add(repo_path: String, paths: Vec<String>, force: bool) -> Output {
	let paths: Vec<PathBuf> = paths.iter().map(PathBuf::from).collect();
	git::add(Path::new(&repo_path), paths, force)
}

#[napi_async]
pub fn commit(repo_path: String, creds: AccessTokenCreds, opts: CommitOptions) -> Output {
	git::commit(Path::new(&repo_path), creds.into(), opts.into())
}

#[napi_async]
pub fn diff(opts: String) -> Output {
	#[derive(serde::Deserialize)]
	#[serde(rename_all = "camelCase")]
	struct Options {
		repo_path: String,
		opts: DiffConfig,
	}

	let opts = serde_json::from_str::<Options>(&opts).map_err(|e| Error::from_reason(e.to_string()))?;
	git::diff(Path::new(&opts.repo_path), opts.opts)
}

#[napi_async]
pub fn restore(repo_path: String, staged: bool, paths: Vec<String>) -> Output {
	let paths: Vec<PathBuf> = paths.into_iter().map(PathBuf::from).collect();
	git::restore(Path::new(&repo_path), staged, paths)
}

#[napi_async]
pub fn reset(repo_path: String, opts: ResetOptions) -> Output {
	git::reset(Path::new(&repo_path), opts.into())
}

#[napi_async]
pub fn stash(repo_path: String, creds: AccessTokenCreds, message: Option<String>) -> Output {
	git::stash(Path::new(&repo_path), message.as_deref(), creds.into())
}

#[napi_async]
pub fn stash_apply(repo_path: String, oid: String) -> Output {
	git::stash_apply(Path::new(&repo_path), &oid)
}

#[napi_async]
pub fn stash_delete(repo_path: String, oid: String) -> Output {
	git::stash_delete(Path::new(&repo_path), &oid)
}

#[napi_async]
pub fn merge(repo_path: String, creds: AccessTokenCreds, opts: MergeOptions) -> Output {
	git::merge(Path::new(&repo_path), creds.into(), opts.into())
}

#[napi_async]
pub fn count_changed_files(repo_path: String, search_in: String) -> Output {
	git::count_changed_files(Path::new(&repo_path), Path::new(&search_in))
}

#[napi_async]
pub fn get_content(repo_path: String, path: String, oid: Option<String>) -> Output {
	git::get_content(Path::new(&repo_path), Path::new(&path), oid.as_deref())
}

#[napi_async]
pub fn get_parent(repo_path: String, oid: String) -> Output {
	git::get_parent(Path::new(&repo_path), &oid)
}

#[napi_async]
pub fn git_read_dir(repo_path: String, scope: TreeReadScope, path: String) -> Output {
	git::read_dir(Path::new(&repo_path), scope.into(), Path::new(&path))
}

#[napi_async]
pub fn git_file_stat(repo_path: String, scope: TreeReadScope, path: String) -> Output {
	git::file_stat(Path::new(&repo_path), scope.into(), Path::new(&path))
}

#[napi_async]
pub fn git_file_exists(repo_path: String, scope: TreeReadScope, path: String) -> Output {
	git::file_exists(Path::new(&repo_path), scope.into(), Path::new(&path))
}

#[napi_async(buffer)]
pub fn git_read_file(repo_path: String, scope: TreeReadScope, path: String) -> Output {
	git::read_file(Path::new(&repo_path), scope.into(), Path::new(&path))
}

#[napi_async]
pub fn git_read_dir_stats(repo_path: String, scope: TreeReadScope, path: String) -> Output {
	git::read_dir_stats(Path::new(&repo_path), scope.into(), Path::new(&path))
}

#[napi_async]
pub fn list_merge_requests(repo_path: String) -> Output {
	git::list_merge_requests(Path::new(&repo_path))
}

#[napi_async]
pub fn find_refs_by_globs(repo_path: String, pattern: Vec<String>) -> Output {
	git::find_refs_by_globs(Path::new(&repo_path), &pattern)
}

#[napi_async]
pub fn create_or_update_merge_request(repo_path: String, merge_request: String, creds: AccessTokenCreds) -> Output {
	let merge_request = serde_json::from_str::<CreateMergeRequest>(&merge_request).map_err(|e| Error::from_reason(e.to_string()))?;
	git::create_or_update_merge_request(Path::new(&repo_path), merge_request, creds.into())
}

#[napi_async]
pub fn get_draft_merge_request(repo_path: String) -> Output {
	git::get_draft_merge_request(Path::new(&repo_path))
}

#[allow(clippy::too_many_arguments)] // napi_async appends span_id/trace_id to the signature
#[napi_async]
pub async fn pull_lfs_objects(
	repo_path: String,
	creds: AccessTokenCreds,
	scope: TreeReadScope,
	paths: Vec<String>,
	checkout: bool,
	cancel_token: u32,
) -> Output {
	git::pull_lfs_objects(
		Path::new(&repo_path),
		creds.into(),
		scope.into(),
		paths.into_iter().map(PathBuf::from).collect(),
		checkout,
		(cancel_token as usize).into(),
	)
}

#[napi_async]
pub fn get_config_val(repo_path: String, name: String) -> Output {
	git::get_config_val(Path::new(&repo_path), &name)
}

#[napi_async]
pub fn set_config_val(repo_path: String, name: String, val: ConfigValue) -> Output {
	git::set_config_val(Path::new(&repo_path), &name, val.into())
}

#[napi_async]
pub fn reset_repo() -> Output {
	git::reset_repo();
	Ok::<bool, ()>(true)
}

#[napi_async]
pub fn reset_file_lock(repo_path: String) -> Output {
	git::reset_file_lock(Path::new(&repo_path));
	Ok::<bool, ()>(true)
}

#[napi_async]
pub fn storage_stats(repo_path: String) -> Output {
	git::storage_stats(Path::new(&repo_path))
}

#[napi_async]
pub fn gc(repo_path: String, opts: GcOptions) -> Output {
	git::gc(Path::new(&repo_path), opts.into())
}

#[napi_async]
pub fn lfs_prune(repo_path: String) -> Output {
	git::lfs_prune(Path::new(&repo_path))
}

#[napi_async]
pub fn healthcheck(repo_path: String) -> Output {
	git::healthcheck(Path::new(&repo_path))
}

#[napi_async]
pub fn get_all_cancel_tokens() -> Output {
	git::get_all_cancel_tokens()
}
