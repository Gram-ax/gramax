use std::path::PathBuf;
use std::{env, fs};

use tauri::*;

pub fn init_env<R: Runtime>(app: &AppHandle<R>) {
  if let Err(err) = dotenvy::from_filename_override(config_path(app)) {
    warn!("Error while loading config: {:?}", err);
  }

  std::env::set_var("GRAMAX_VERSION", app.package_info().version.to_string());

  if env::var("ROOT_PATH").is_err() {
    let root = root_path(app);
    env::set_var("ROOT_PATH", root.display().to_string());
    std::fs::create_dir_all(root).expect("Can't create docs dir");
  }

  if let Ok(docs_path) = app.path().resource_dir().map(|path| path.join("docs")) {
    let doc_root = docs_path.join("docs/.doc-root.yaml");

    if let Ok(mut content) = fs::read_to_string(&doc_root) {
      if !content.contains("readOnly") {
        content.push_str("\nreadOnly: true\nshowHomePage: false");
        fs::write(&doc_root, content).unwrap();
      }

      env::set_var("LOCAL_DOC_PATH", docs_path);
    }
  }
}

pub fn root_path<R: Runtime>(app: &AppHandle<R>) -> PathBuf {
  std::env::var("ROOT_PATH")
    .map(PathBuf::from)
    .unwrap_or(app.path().document_dir().expect("Document directory not exists").join("docs"))
}

pub fn config_path<R: Runtime>(app: &AppHandle<R>) -> std::path::PathBuf {
  app.path().app_config_dir().expect("Config directory doesn't exists").join(".config")
}
