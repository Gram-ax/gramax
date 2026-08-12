use std::path::Path;

use gramaxfs::commands::FsScope;
use gramaxfs::compress::CompressOptions;
use http::Request;
use tauri::http::Method;
use tauri::http::Response;
use tauri_otel_context::OtelContext;

use tauri::plugin::TauriPlugin;
use tauri::*;

mod fs;
mod git;
pub mod utils;

trait IntoResponse {
	fn into_response(self) -> Response<Vec<u8>>;
}

trait AttachHeaders {
	fn attach_headers(self) -> Self;
}

impl<T: Into<Vec<u8>>> IntoResponse for gramaxfs::Result<T> {
	fn into_response(self) -> Response<Vec<u8>> {
		match self {
			Ok(value) => Response::builder()
				.status(200)
				.attach_headers()
				.header("content-type", "application/octet-stream")
				.body(value.into())
				.unwrap(),
			Err(err) => Response::builder()
				.status(500)
				.attach_headers()
				.header("content-type", "application/json")
				.body(serde_json::to_vec(&err).unwrap())
				.unwrap(),
		}
	}
}

impl AttachHeaders for tauri::http::response::Builder {
	fn attach_headers(self) -> Self {
		self
			.header("access-control-allow-origin", "*")
			.header("access-control-allow-headers", "*")
	}
}

fn handle_req(req: Request<Vec<u8>>) -> Response<Vec<u8>> {
	let _otel = OtelContext::from_headers(req.headers());

	if req.method() == Method::OPTIONS {
		return Response::builder().status(200).attach_headers().body(vec![]).unwrap();
	}

	let path = match urlencoding::decode(&req.uri().path()[1..]) {
		Ok(path) => path,
		Err(err) => {
			return Response::builder().status(400).attach_headers().body(err.as_bytes().to_vec()).unwrap();
		}
	};

	let path = Path::new(&*path);

	let scope = match req
		.headers()
		.get("x-fs-ctx")
		.and_then(|val| val.to_str().ok())
		.and_then(|val| urlencoding::decode(val).ok())
		.map(|val| serde_json::from_str::<FsScope>(&val))
	{
		Some(Ok(scope)) => scope,
		Some(Err(err)) => return Response::builder().status(400).body(err.to_string().as_bytes().to_vec()).unwrap(),
		None => return Response::builder().status(400).body("no scope provided".as_bytes().to_vec()).unwrap(),
	};

	match *req.method() {
		Method::GET => scope.open().read(path).into_response(),
		Method::POST => {
			let compress_opts = req
				.headers()
				.get("x-compress")
				.and_then(|val| val.to_str().ok())
				.and_then(|val| serde_json::from_str::<CompressOptions>(val).ok());

			scope.open().write(path, req.body(), compress_opts).map(|_| vec![]).into_response()
		}
		_ => Response::builder()
			.status(400)
			.attach_headers()
			.header("content-type", "application/json")
			.body(vec![])
			.unwrap(),
	}
}

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_gramaxcore);

#[allow(unused)]
pub fn init<R: Runtime>() -> TauriPlugin<R> {
	use fs::*;
	use git::*;

	let builder = tauri::plugin::Builder::new("plugin-gramax-core")
		.setup(|app, api| {
			#[cfg(target_os = "ios")]
			api.register_ios_plugin(init_plugin_gramaxcore)?;

			#[cfg(target_os = "android")]
			api.register_android_plugin(app.config().identifier.as_str(), "GramaxFS")?;
			Ok(())
		})
		.invoke_handler(tauri::generate_handler![
			read_dir,
			read_link,
			make_dir,
			remove_dir,
			rmfile,
			mv,
			hardlink,
			getstat,
			exists,
			copy,
			read_dir_stats,
			delete_empty_dirs,
			scan_workspace,
			scan_catalog,
			watch_workspace,
			unwatch_workspace,
			init_new,
			clone,
			cancel,
			recover,
			file_history,
			checkout,
			fetch,
			stash,
			stash_apply,
			push,
			add,
			status,
			status_file,
			branch_info,
			new_branch,
			stash_delete,
			delete_branch,
			default_branch,
			get_remote,
			branch_list,
			diff,
			add_remote,
			has_remotes,
			reset,
			commit,
			merge,
			has_merge_conflicts,
			restore,
			get_parent,
			get_content,
			count_changed_files,
			get_commit_info,
			git_read_dir,
			git_file_stat,
			git_file_exists,
			git_read_dir_stats,
			find_refs_by_globs,
			is_init,
			is_bare,
			set_head,
			list_merge_requests,
			create_or_update_merge_request,
			get_draft_merge_request,
			get_all_commit_authors,
			format_merge_message,
			pull_lfs_objects,
			storage_stats,
			gc,
			lfs_prune,
			get_config_val,
			set_config_val,
			healthcheck,
			get_all_cancel_tokens,
			reset_repo,
			reset_file_lock,
		]);

	#[cfg(not(target_os = "linux"))]
	let builder = builder.register_asynchronous_uri_scheme_protocol("gx-fs", |_, req, responder| responder.respond(handle_req(req)));

	#[cfg(target_os = "linux")]
	let builder = builder.register_uri_scheme_protocol("gx-fs", |_, req| handle_req(req));

	builder.build()
}
