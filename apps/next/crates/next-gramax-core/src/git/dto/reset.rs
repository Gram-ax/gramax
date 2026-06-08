use gramaxgit::prelude::OidInfo;

#[napi(string_enum = "lowercase")]
#[derive(Clone)]
pub enum ResetMode {
	Soft,
	Mixed,
	Hard,
}

impl From<ResetMode> for gramaxgit::actions::reset::ResetMode {
	fn from(val: ResetMode) -> Self {
		match val {
			ResetMode::Soft => gramaxgit::actions::reset::ResetMode::Soft,
			ResetMode::Mixed => gramaxgit::actions::reset::ResetMode::Mixed,
			ResetMode::Hard => gramaxgit::actions::reset::ResetMode::Hard,
		}
	}
}

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct ResetOptions {
	pub head: Option<String>,
	pub mode: ResetMode,
}

impl From<ResetOptions> for gramaxgit::actions::reset::ResetOptions {
	fn from(val: ResetOptions) -> Self {
		gramaxgit::actions::reset::ResetOptions {
			mode: val.mode.into(),
			head: val.head.map(OidInfo),
		}
	}
}
