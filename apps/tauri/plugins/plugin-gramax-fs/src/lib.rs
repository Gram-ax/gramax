use std::path::Path;

use http::Request;
use tauri::http::Method;
use tauri::http::Response;

use tauri::plugin::Builder;
use tauri::plugin::TauriPlugin;

use gramaxfs::Result;
use tauri::*;

mod commands;

trait IntoResponse {
  fn into_response(self) -> Response<Vec<u8>>;
}

impl<T: Into<Vec<u8>>> IntoResponse for gramaxfs::Result<T> {
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

fn read_file<P: AsRef<Path>>(path: P) -> Result<Vec<u8>> {
  Ok(std::fs::read(path)?)
}

fn write_file<P: AsRef<Path>>(path: P, content: &[u8]) -> Result<()> {
  Ok(std::fs::write(path, content)?)
}

fn handle_req(req: Request<Vec<u8>>) -> Response<Vec<u8>> {
  let path = match urlencoding::decode(&req.uri().path()[1..]) {
    Ok(path) => path,
    Err(err) => {
      let res = Response::builder().status(400).body(err.as_bytes().to_vec()).unwrap();
      return res;
    }
  };

  let res = match *req.method() {
    Method::GET => read_file(path.as_ref()).into_response(),
    Method::POST => write_file(path.as_ref(), req.body()).map(|_| vec![]).into_response(),
    _ => Response::builder()
      .status(405)
      .header("access-control-allow-origin", "*")
      .header("content-type", "application/json")
      .body(vec![])
      .unwrap(),
  };
  res
}

#[cfg(target_os = "ios")]
tauri::ios_plugin_binding!(init_plugin_gramaxfs);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
  use commands::*;

  let builder = Builder::new("plugin-gramax-fs")
    .setup(|app, _api| {
      #[cfg(target_os = "ios")]
      _api.register_ios_plugin(init_plugin_gramaxfs)?;

      #[cfg(target_os = "android")]
      _api.register_android_plugin(app.config().identifier.as_str(), "GramaxFS")?;
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      write_file,
      read_dir,
      read_link,
      make_dir,
      remove_dir,
      rmfile,
      mv,
      make_symlink,
      getstat,
      exists,
      copy,
      read_dir_stats
    ]);

  #[cfg(not(target_os = "linux"))]
  let builder = builder.register_asynchronous_uri_scheme_protocol("gramax-fs-stream", |_, req, responder| {
    responder.respond(handle_req(req))
  });

  #[cfg(target_os = "linux")]
  let builder = builder.register_uri_scheme_protocol("gramax-fs-stream", |_, req| handle_req(req));

  builder.build()
}
