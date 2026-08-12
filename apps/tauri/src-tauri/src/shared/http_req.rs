use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use serde::Deserialize;
use serde::Serialize;

use tauri::*;
use tauri_otel_context::OtelContext;

use reqwest::header::*;
use reqwest::Client;
use reqwest::Method;
use reqwest_cookie_store::CookieStore;
use reqwest_cookie_store::CookieStoreMutex;

use crate::settings::get_settings_inner;
use crate::settings::update_setting;

const COOKIES_SETTING_KEY: &str = "cookies";

type CookieJar = Arc<CookieStoreMutex>;

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
#[serde(rename_all = "camelCase")]
pub struct Request {
	url: String,
	body: Option<String>,
	method: Option<String>,
	headers: Option<HashMap<String, String>>,
	auth: Option<Auth>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Response {
	body: ResponseBody,
	status: u16,
	status_text: Option<String>,
	content_type: Option<String>,
}

#[derive(Serialize)]
pub struct RequestError {
	message: String,
	status: Option<u16>,
}

impl From<reqwest::Error> for RequestError {
	fn from(error: reqwest::Error) -> Self {
		RequestError {
			message: error.to_string(),
			status: error.status().map(|s| s.as_u16()),
		}
	}
}

#[command]
pub async fn http_request<R: Runtime>(_otel: OtelContext, manager: AppHandle<R>, req: Request) -> std::result::Result<Response, RequestError> {
	drop(_otel);

	let cookie_jar = init_cookie_jar(&manager);

	let client = Client::builder()
		.cookie_provider(Arc::clone(&cookie_jar))
		.connect_timeout(Duration::from_secs(10))
		.timeout(Duration::from_secs(30))
		.build()?;

	let request = client.request(req.method.and_then(|m| m.parse().ok()).unwrap_or(Method::GET), req.url);

	let request = match req.auth {
		Some(Auth::Token { token }) => request.bearer_auth(token),
		Some(Auth::Basic { login, password }) => request.basic_auth(login, password),
		None => request,
	};

	let request = match req.body {
		Some(body) => request.header(CONTENT_TYPE, "application/json").body(body),
		None => request,
	};

	let request = match req.headers {
		Some(headers) => {
			let mut header_map = HeaderMap::new();
			for (name, value) in headers {
				let Ok(name) = HeaderName::from_lowercase(name.to_lowercase().as_bytes()) else {
					continue;
				};
				let Ok(value) = HeaderValue::from_str(&value) else { continue };
				header_map.insert(name, value);
			}
			request.headers(header_map)
		}
		None => request,
	};

	let response = request.send().await?;
	let status_code = response.status();
	let status = status_code.as_u16();
	let status_text = status_code.canonical_reason().map(String::from);
	let content_type = response.headers().get(CONTENT_TYPE).and_then(|v| v.to_str().ok().map(String::from));

	save_cookie_jar(&manager, &cookie_jar);

	let body = match content_type.as_deref() {
		Some(v) if v.contains("application/json") || v.contains("text") => ResponseBody::Text(response.text().await?),
		_ => ResponseBody::Binary(response.bytes().await?.to_vec()),
	};

	Ok(Response {
		status,
		status_text,
		content_type,
		body,
	})
}

fn init_cookie_jar<R: Runtime>(manager: &AppHandle<R>) -> CookieJar {
	manager
		.try_state::<CookieJar>()
		.map(|s| Arc::clone(s.inner()))
		.unwrap_or_else(|| {
			let store = load_cookie_store_from_settings(manager).unwrap_or_else(CookieStore::new);
			let jar: CookieJar = Arc::new(CookieStoreMutex::new(store));
			manager.manage(Arc::clone(&jar));
			manager.try_state::<CookieJar>().map(|s| Arc::clone(s.inner())).unwrap_or(jar)
		})
}

fn load_cookie_store_from_settings<R: Runtime>(manager: &AppHandle<R>) -> Option<CookieStore> {
	let settings = get_settings_inner(manager).ok()?;
	let raw_value = settings.get(COOKIES_SETTING_KEY).cloned()?;
	let cookies: Vec<cookie_store::Cookie<'static>> = serde_json::from_value(raw_value).ok()?;
	CookieStore::from_cookies(into_ok_iter::<_, cookie_store::CookieError>(cookies), false).ok()
}

fn into_ok_iter<T, E>(items: Vec<T>) -> impl Iterator<Item = std::result::Result<T, E>> {
	items.into_iter().map(Ok)
}

fn save_cookie_jar<R: Runtime>(manager: &AppHandle<R>, jar: &CookieJar) {
	let value = {
		let Ok(mut store) = jar.lock() else { return };

		remove_expired_cookies(&mut store);

		let persistent: Vec<&cookie_store::Cookie<'static>> = store.iter_any().filter(|c| c.is_persistent()).collect();

		match serde_json::to_value(persistent) {
			Ok(value) => value,
			Err(e) => {
				error!("failed to serialize cookies: {e:?}");
				return;
			}
		}
	};

	if let Err(e) = update_setting(manager, COOKIES_SETTING_KEY, value) {
		error!("failed to persist cookies into settings: {e:?}");
	}
}

fn remove_expired_cookies(store: &mut CookieStore) {
	let expired: Vec<(String, String, String)> = store
		.iter_any()
		.filter(|c| c.is_expired())
		.map(|c| (String::from(&c.domain), String::from(&c.path), c.name().to_string()))
		.collect();

	for (domain, path, name) in expired {
		let _ = store.remove(&domain, &path, &name);
	}
}
