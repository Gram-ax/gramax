#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct RemoteOptions {
	pub cancel_token: u32,
	pub force: bool,
}

impl From<RemoteOptions> for gramaxgit::actions::remote::RemoteOptions<'_> {
	fn from(val: RemoteOptions) -> Self {
		gramaxgit::actions::remote::RemoteOptions {
			cancel_token: (val.cancel_token as usize).into(),
			force: val.force,
		}
	}
}
