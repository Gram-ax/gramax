use serde::de::DeserializeOwned;
use tauri::{
  plugin::{PluginApi, PluginHandle},
  AppHandle, Runtime,
};

use crate::models::*;

#[cfg(target_os = "android")]
const PLUGIN_IDENTIFIER: &str = "com.ics.gramax.git";

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_plugin - gramax - git);

// initializes the Kotlin or Swift plugin classes
pub fn init<R: Runtime, C: DeserializeOwned>(
  _app: &AppHandle<R>,
  api: PluginApi<R, C>,
) -> Result<PluginGramaxGit<R>> {
  #[cfg(target_os = "android")]
  let handle = api.register_android_plugin(PLUGIN_IDENTIFIER, "GramaxGitPlugin")?;
  #[cfg(target_os = "ios")]
  let handle = api.register_ios_plugin(init - gramax - git)?;
  Ok(PluginGramaxGit(handle))
}
