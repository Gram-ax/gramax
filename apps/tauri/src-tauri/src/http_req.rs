use serde::Deserialize;
use serde::Serialize;

use tauri::*;

use reqwest::Method;

#[derive(Deserialize)]
#[serde(untagged)]
pub enum Auth {
  Token { token: String },
  Basic { login: String, password: Option<String> },
}

#[derive(Serialize)]
#[serde(tag = "type", content = "data")]
#[serde(rename_all = "camelCase")]
pub enum ResponseBody {
  Text(String),
  Binary(Vec<u8>),
}

#[derive(Deserialize)]
pub struct Request {
  url: String,
  body: Option<String>,
  method: Option<String>,
  auth: Option<Auth>,
}

#[derive(Serialize)]
pub struct Response {
  body: ResponseBody,
  status: u16,
}

#[derive(Serialize)]
pub struct RequestError {
  message: String,
  status: u16,
}

impl From<reqwest::Error> for RequestError {
  fn from(error: reqwest::Error) -> Self {
    RequestError { message: error.to_string(), status: error.status().unwrap_or_default().as_u16() }
  }
}

#[command]
pub async fn http_request(req: Request) -> std::result::Result<Response, RequestError> {
  let client = reqwest::Client::new();
  let request = client.request(req.method.and_then(|m| m.parse().ok()).unwrap_or(Method::GET), req.url);

  let request = match req.auth {
    Some(Auth::Token { token }) => request.bearer_auth(token),
    Some(Auth::Basic { login, password }) => request.basic_auth(login, password),
    None => request,
  };

  let request = match req.body {
    Some(body) => request.body(body),
    None => request,
  };

  let response = request.send().await?;
  let status = response.status().as_u16();
  let is_text = response
    .headers()
    .get("Content-Type")
    .and_then(|v| v.to_str().ok())
    .map(|v| v.contains("application/json") || v.contains("text"))
    .unwrap_or(false);

  let body = match is_text {
    true => ResponseBody::Text(response.text().await?),
    false => ResponseBody::Binary(response.bytes().await?.to_vec()),
  };

  Ok(Response { status, body })
}
