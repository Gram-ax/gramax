#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct MergeMessageFormatOptions {
	pub theirs: String,
	pub squash: Option<bool>,
	pub max_commits: Option<i32>,
	pub is_merge_request: Option<bool>,
}

impl From<MergeMessageFormatOptions> for gramaxgit::actions::merge::MergeMessageFormatOptions {
	fn from(val: MergeMessageFormatOptions) -> Self {
		gramaxgit::actions::merge::MergeMessageFormatOptions {
			theirs: val.theirs,
			ours: None,
			squash: val.squash.unwrap_or_default(),
			max_commits: val.max_commits.map(|x| x as usize),
			is_merge_request: val.is_merge_request.unwrap_or_default(),
		}
	}
}

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct MergeOptions {
	pub theirs: String,
	pub delete_after_merge: Option<bool>,
	pub squash: Option<bool>,
	pub is_merge_request: Option<bool>,
}

impl From<MergeOptions> for gramaxgit::actions::merge::MergeOptions {
	fn from(val: MergeOptions) -> Self {
		gramaxgit::actions::merge::MergeOptions {
			theirs: val.theirs,
			delete_after_merge: val.delete_after_merge.unwrap_or_default(),
			squash: val.squash.unwrap_or_default(),
			is_merge_request: val.is_merge_request.unwrap_or_default(),
		}
	}
}
