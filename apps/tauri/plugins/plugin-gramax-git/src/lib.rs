use http::Request;
use http::Response;
use serde::Deserialize;
use tauri::plugin::*;
use tauri::*;

use commands::*;

use std::path::Path;
use std::path::PathBuf;

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;

pub struct PluginGramaxGit<R: Runtime>(AppHandle<R>);

impl<R: Runtime> PluginGramaxGit<R> {
  pub fn repo(&self, _path: &Path) {}
}

pub trait GramaxGitExt<R: Runtime> {
  fn plugin_gramax_git(&self) -> &PluginGramaxGit<R>;
}

impl<R: Runtime, T: Manager<R>> crate::GramaxGitExt<R> for T {
  fn plugin_gramax_git(&self) -> &PluginGramaxGit<R> {
    self.state::<PluginGramaxGit<R>>().inner()
  }
}

trait IntoResponse {
  fn into_response(self) -> Response<Vec<u8>>;
}

impl<T: Into<Vec<u8>>> IntoResponse for gramaxgit::commands::Result<T> {
  fn into_response(self) -> Response<Vec<u8>> {
    match self {
      Ok(value) => Response::builder()
        .status(200)
        .header("access-control-allow-origin", "*")
        .header("content-type", "application/octet-stream")
        .body(value.into())
        .unwrap(),
      Err(err) => Response::builder()
        .status(500)
        .header("access-control-allow-origin", "*")
        .header("content-type", "application/json")
        .body(serde_json::to_vec(&err).unwrap())
        .unwrap(),
    }
  }
}

fn handle_req(req: Request<Vec<u8>>) -> Response<Vec<u8>> {
  #[derive(Deserialize)]
  #[serde(rename_all = "camelCase")]
  struct Args {
    repo_path: PathBuf,
    path: PathBuf,
    scope: gramaxgit::commands::TreeReadScope,
  }

  match serde_json::from_slice::<Args>(req.body()) {
    Ok(args) => gramaxgit::commands::read_file(&args.repo_path, args.scope, &args.path).into_response(),
    Err(err) => Response::builder()
      .status(400)
      .header("access-control-allow-origin", "*")
      .header("content-type", "application/json")
      .body(err.to_string().as_bytes().to_vec())
      .unwrap(),
  }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  let builder = plugin::Builder::new("plugin-gramax-git")
    .invoke_handler(tauri::generate_handler![
      init_new,
      clone,
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
      get_remote,
      branch_list,
      diff,
      add_remote,
      has_remotes,
      reset_all,
      commit,
      merge,
      restore,
      get_parent,
      get_content,
      graph_head_upstream_files,
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
      invalidate_repo_cache
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let plugin_gramax_git = mobile::init(app, api)?;
      #[cfg(desktop)]
      let plugin_gramax_git = desktop::init(app, api);
      app.manage(plugin_gramax_git);
      Ok(())
    });

  #[cfg(not(target_os = "linux"))]
  let builder =
    builder.register_asynchronous_uri_scheme_protocol("gramax-gitfs-stream", |_, req, responder| {
      tauri::async_runtime::spawn(async move { responder.respond(handle_req(req)) });
    });

  #[cfg(target_os = "linux")]
  let builder = builder.register_uri_scheme_protocol("gramax-gitfs-stream", |_, req| handle_req(req));

  builder.build()
}
