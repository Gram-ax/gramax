use gramaxgit::prelude::CloneOptions;

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct RawCloneOptions {
	pub branch: Option<String>,
	pub depth: Option<i32>,
	pub url: String,
	pub to: String,
	pub is_bare: bool,
	pub allow_non_empty_dir: bool,
	pub skip_lfs_pull: bool,
	pub cancel_token: u32,
}

impl From<RawCloneOptions> for CloneOptions {
	fn from(val: RawCloneOptions) -> Self {
		gramaxgit::actions::clone::CloneOptions {
			allow_non_empty_dir: val.allow_non_empty_dir,
			branch: val.branch,
			depth: val.depth,
			url: val.url,
			to: val.to.into(),
			is_bare: val.is_bare,
			cancel_token: val.cancel_token as usize,
			skip_lfs_pull: val.skip_lfs_pull,
		}
	}
}
