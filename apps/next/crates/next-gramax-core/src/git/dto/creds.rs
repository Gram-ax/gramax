#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct AccessTokenCreds {
	pub author_name: String,
	pub author_email: String,
	pub access_token: String,
	pub username: Option<String>,
	pub protocol: Option<String>,
}

impl From<AccessTokenCreds> for gramaxgit::creds::AccessTokenCreds {
	fn from(val: AccessTokenCreds) -> Self {
		gramaxgit::creds::AccessTokenCreds::new(
			&val.author_name,
			&val.author_email,
			&val.access_token,
			val.username.as_deref(),
			val.protocol.as_deref(),
		)
	}
}
