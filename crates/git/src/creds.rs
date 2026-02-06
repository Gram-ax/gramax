use git2::*;
use serde::Deserialize;

pub trait Creds: Clone {
	fn signature(&self) -> Result<Signature<'_>, Error>;
	fn access_token(&self) -> &str;
	fn username(&self) -> &str;
	fn protocol(&self) -> Option<&str>;
}

pub trait ActualCreds: Creds {}

#[derive(Clone)]
pub struct DummyCreds;

impl Creds for DummyCreds {
	fn signature(&self) -> Result<Signature<'_>, Error> {
		Signature::now("Test", "test@email.org")
	}

	fn access_token(&self) -> &str {
		""
	}

	fn username(&self) -> &str {
		"git"
	}

	fn protocol(&self) -> Option<&str> {
		None
	}
}

#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AccessTokenCreds {
	author_name: Box<str>,
	author_email: Box<str>,
	access_token: Box<str>,
	username: Option<Box<str>>,
	protocol: Option<Box<str>>,
}

impl AccessTokenCreds {
	pub fn new(author_name: &str, author_email: &str, access_token: &str, username: Option<&str>, protocol: Option<&str>) -> Self {
		Self {
			author_name: author_name.into(),
			author_email: author_email.into(),
			access_token: access_token.into(),
			username: username.map(|u| u.into()),
			protocol: protocol.map(|p| p.into()),
		}
	}
}

impl Creds for AccessTokenCreds {
	fn signature(&self) -> Result<Signature<'_>, Error> {
		Signature::now(&self.author_name, &self.author_email)
	}

	fn access_token(&self) -> &str {
		&self.access_token
	}

	fn protocol(&self) -> Option<&str> {
		self.protocol.as_deref()
	}

	fn username(&self) -> &str {
		self.username.as_deref().unwrap_or("git")
	}
}

impl ActualCreds for AccessTokenCreds {}

impl std::fmt::Debug for AccessTokenCreds {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		let mut debug = f.debug_struct("AccessTokenCreds");
		debug
			.field("name", &self.author_name)
			.field("email", &self.author_email)
			.field("access_token", if self.access_token.is_empty() { &"<empty>" } else { &"<redacted>" });

		if let Some(username) = &self.username {
			debug.field("username", &username);
		}

		if let Some(protocol) = &self.protocol {
			debug.field("protocol", &protocol);
		}

		debug.finish()
	}
}
