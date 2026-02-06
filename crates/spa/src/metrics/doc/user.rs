use std::ops::Deref;

use serde::Deserialize;
use serde::Serialize;

use axum_extra::extract::cookie::Cookie;
use axum_extra::extract::cookie::SameSite;
use axum_extra::extract::CookieJar;

use crate::metrics::doc::UNIQ_ID_COOKIE_NAME;
use crate::updater::Channel;
use crate::updater::Package;
use crate::updater::Platform;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(transparent)]
pub struct UserId(pub String);

impl Deref for UserId {
	type Target = str;
	fn deref(&self) -> &Self::Target {
		&self.0
	}
}

impl std::fmt::Display for UserId {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "{}", self.0)
	}
}

impl UserId {
	pub fn gen() -> Self {
		Self(nanoid::nanoid!(16))
	}

	pub fn from_jar(jar: &CookieJar) -> Option<Self> {
		jar.get(UNIQ_ID_COOKIE_NAME).map(|c| Self(c.value().to_string()))
	}

	pub fn set_cookie(self, domain: Option<String>, jar: CookieJar) -> CookieJar {
		let mut cookie = Cookie::new(UNIQ_ID_COOKIE_NAME, self.0);
		cookie.set_http_only(true);
		if let Some(domain) = domain {
			cookie.set_domain(domain);
			cookie.set_same_site(SameSite::Lax);
		}
		jar.add(cookie)
	}
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "kebab-case")]
pub enum UserAction {
	GetAssets,
	CheckUpdates {
		channel: Channel,
	},
	CheckUpdate {
		channel: Channel,
		platform: Platform,
		package: Option<Package>,
	},
	Download {
		channel: Channel,
		platform: Platform,
		package: Option<Package>,
	},
	Other(String),
	Unknown,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "kebab-case")]
pub struct UserMetadata {
	pub os: Option<String>,
	pub os_version: Option<String>,
	pub browser: Option<String>,
	pub browser_version: Option<String>,
	pub platform: Option<String>,
	pub device: Option<String>,
}
