use std::result::Result;
use std::time::Duration;

use tauri::async_runtime;
use tiny_http::*;

const HTTP_SERVER_ADDRESS: &str = "127.0.0.1:52054";
const HTTP_SERVER_TIMEOUT: Duration = Duration::from_secs(60 * 6);

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

pub fn listen_one<F: FnOnce(&Request) + Send + Sync + 'static>(redirect: Box<str>, on_request: F) {
  async_runtime::spawn(async move { start_server(&redirect, on_request) });
}

fn start_server<F: FnOnce(&Request)>(#[allow(unused)] redirect: &str, on_request: F) -> Result<(), Error> {
  let server = Server::http(HTTP_SERVER_ADDRESS)?;
  warn!("http-server started at {HTTP_SERVER_ADDRESS}");

  #[cfg(target_os = "ios")]
  let redirect = "gramax://";

  if let Ok(Some(req)) = server.recv_timeout(HTTP_SERVER_TIMEOUT) {
    on_request(&req);
    let res = Response::new_empty(StatusCode(301))
      .with_header(Header { field: "Location".parse().unwrap(), value: redirect.parse()? });
    req.respond(res)?;
  }

  warn!("http-server died");
  Ok(())
}
