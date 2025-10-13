use std::result::Result;
use std::time::Duration;

use tauri::async_runtime;
use tiny_http::*;

const HTTP_OAUTH_SERVER_ADDRESS: &str = "127.0.0.1:52054";
const HTTP_OAUTH_SERVER_TIMEOUT: Duration = Duration::from_secs(60 * 6);
const HTTP_PING_SERVER_ADDRESS: &str = "127.0.0.1:52055";

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

#[derive(serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase", tag = "type", content = "value")]
pub enum OauthListenOnceAction {
  Redirect(Box<str>),
  TryClose,
}

pub fn oauth_listen_once<F: FnOnce(&Request) + Send + Sync + 'static>(
  action: OauthListenOnceAction,
  on_request: F,
) {
  async_runtime::spawn(async move {
    if let Err(err) = serve_oauth(action, on_request) {
      error!("oauth server died with error: {err:?}")
    }
  });
}

pub fn start_ping_server<F: Fn(&Request) + Send + Sync + 'static>(on_request: F) {
  async_runtime::spawn(async move {
    if let Err(err) = serve_ping(on_request) {
      error!("ping server died with error: {err:?}");
    }
  });
}

fn serve_oauth<F: FnOnce(&Request)>(action: OauthListenOnceAction, on_request: F) -> Result<(), Error> {
  let server = Server::http(HTTP_OAUTH_SERVER_ADDRESS)?;
  info!("http-server started at {HTTP_OAUTH_SERVER_ADDRESS}");

  #[cfg(target_os = "ios")]
  let redirect = "gramax://";

  if let Ok(Some(req)) = server.recv_timeout(HTTP_OAUTH_SERVER_TIMEOUT) {
    on_request(&req);

    match action {
      OauthListenOnceAction::Redirect(redirect) => {
        let res = Response::new_empty(StatusCode(301))
          .with_header(Header { field: "Location".parse().unwrap(), value: redirect.parse()? })
          .with_header(Header {
            field: "Cache-Control".parse().unwrap(),
            value: "no-store, no-cache".parse()?,
          });
        req.respond(res)?;
      }
      OauthListenOnceAction::TryClose => {
        let res = Response::from_data(include_bytes!("../scripts/close-window.html"))
          .with_status_code(StatusCode(200))
          .with_header(Header {
            field: "Content-Type".parse().unwrap(),
            value: "text/html".parse().unwrap(),
          });
        req.respond(res)?;
      }
    }
  }

  info!("http-server died");
  Ok(())
}

fn serve_ping<F: Fn(&Request) + Send + Sync + 'static>(on_request: F) -> Result<(), Error> {
  let server = Server::http(HTTP_PING_SERVER_ADDRESS)?;
  info!("ping-http-server started at {HTTP_PING_SERVER_ADDRESS}");

  while let Ok(req) = server.recv() {
    on_request(&req);

    let res = Response::empty(StatusCode(200))
      .with_header(Header {
        field: "access-control-allow-origin".parse().unwrap(),
        value: "*".parse().unwrap(),
      })
      .with_header(Header {
        field: "access-control-allow-private-network".parse().unwrap(),
        value: "true".parse().unwrap(),
      });

    req.respond(res)?;
  }

  info!("ping-http-server died");
  Ok(())
}
