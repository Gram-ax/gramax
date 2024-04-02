use tauri::plugin::*;
use tauri::*;

use commands::*;

use std::{collections::HashMap, path::Path, sync::Mutex};

#[cfg(desktop)]
mod desktop;
#[cfg(mobile)]
mod mobile;

mod commands;

pub struct PluginGramaxGit<R: Runtime>(AppHandle<R>);

impl<R: Runtime> PluginGramaxGit<R> {
  pub fn repo(&self, _path: &Path) {
  }
}

#[derive(Default)]
struct MyState(Mutex<HashMap<String, String>>);

pub trait GramaxGitExt<R: Runtime> {
  fn plugin_gramax_git(&self) -> &PluginGramaxGit<R>;
}

impl<R: Runtime, T: Manager<R>> crate::GramaxGitExt<R> for T {
  fn plugin_gramax_git(&self) -> &PluginGramaxGit<R> {
    self.state::<PluginGramaxGit<R>>().inner()
  }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  plugin::Builder::new("gramaxgit")
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
      get_content
    ])
    .setup(|app, api| {
      #[cfg(mobile)]
      let plugin_gramax_git = mobile::init(app, api)?;
      #[cfg(desktop)]
      let plugin_gramax_git = desktop::init(app, api);
      app.manage(plugin_gramax_git);
      Ok(())
    })
    .build()
}
