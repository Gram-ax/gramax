use tauri::{
  plugin::{Builder, TauriPlugin},
  Runtime,
};

mod commands;

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_gramaxfs);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  use commands::*;

  Builder::new("gramaxfs")
    .setup(|_app, _api| {
      #[cfg(target_os = "ios")]
      _api.register_ios_plugin(init_plugin_gramaxfs)?;

      #[cfg(target_os = "android")]
      _api.register_android_plugin("com.ics.gramax.fs", "GramaxFS")?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      read_dir,
      read_file,
      write_file,
      read_link,
      make_dir,
      remove_dir,
      rmfile,
      mv,
      make_symlink,
      getstat,
      exists,
      copy,
      mv
    ])
    .build()
}
