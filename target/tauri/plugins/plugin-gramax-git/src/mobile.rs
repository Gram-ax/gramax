use serde::de::DeserializeOwned;
use tauri::plugin::*;
use tauri::*;

use crate::PluginGramaxGit;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.ics.gramax.git";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_gramaxgit);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> Result<PluginGramaxGit<R>> {
  #[cfg(target_os = "android")]
  api.register_android_plugin(PLUGIN_IDENTIFIER, "GramaxGitPlugin")?;
  #[cfg(target_os = "ios")]
  api.register_ios_plugin(init_plugin_gramaxgit).expect("init ios gramaxgit plugin");
  Ok(PluginGramaxGit(app.clone()))
}
