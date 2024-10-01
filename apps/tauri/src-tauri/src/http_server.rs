use std::result::Result;
use std::time::Duration;

use tauri::async_runtime;
use tiny_http::*;

const HTTP_OAUTH_SERVER_ADDRESS: &str = "127.0.0.1:52054";
const HTTP_OAUTH_SERVER_TIMEOUT: Duration = Duration::from_secs(60 * 6);
const HTTP_PING_SERVER_ADDRESS: &str = "127.0.0.1:52055";

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

pub fn oauth_listen_once<F: FnOnce(&Request) + Send + Sync + 'static>(redirect: Box<str>, on_request: F) {
  async_runtime::spawn(async move {
    if let Err(err) = serve_oauth(&redirect, on_request) {
      error!("oauth server died with error: {:?}", err)
    }
  });
}

pub fn start_ping_server<F: Fn(&Request) + Send + Sync + 'static>(on_request: F) {
  async_runtime::spawn(async move {
    if let Err(err) = serve_ping(on_request) {
      error!("ping server died with error: {:?}", err);
    }
  });
}

fn serve_oauth<F: FnOnce(&Request)>(redirect: &str, on_request: F) -> Result<(), Error> {
  let server = Server::http(HTTP_OAUTH_SERVER_ADDRESS)?;
  info!("http-server started at {HTTP_OAUTH_SERVER_ADDRESS}");

  #[cfg(target_os = "ios")]
  let redirect = "gramax://";

  if let Ok(Some(req)) = server.recv_timeout(HTTP_OAUTH_SERVER_TIMEOUT) {
    on_request(&req);
    let res = Response::new_empty(StatusCode(301))
      .with_header(Header { field: "Location".parse().unwrap(), value: redirect.parse()? });
    req.respond(res)?;
  }

  info!("http-server died");
  Ok(())
}

fn serve_ping<F: Fn(&Request) + Send + Sync + 'static>(on_request: F) -> Result<(), Error> {
  let server = Server::http(HTTP_PING_SERVER_ADDRESS)?;
  info!("ping-http-server started at {HTTP_PING_SERVER_ADDRESS}");

  while let Ok(req) = server.recv() {
    on_request(&req);

    let res = Response::empty(StatusCode(200)).with_header(Header {
      field: "access-control-allow-origin".parse().unwrap(),
      value: "*".parse().unwrap(),
    });

    req.respond(res)?;
  }

  info!("ping-http-server died");
  Ok(())
}
