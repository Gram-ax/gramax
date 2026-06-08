#[napi(string_enum)]
#[derive(Clone)]
pub enum TreeReadScopeObjectType {
	Head,
	Commit,
	Reference,
}

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct TreeReadScope {
	pub object_type: TreeReadScopeObjectType,
	pub reference: Option<String>,
}

impl From<TreeReadScope> for gramaxgit::commands::TreeReadScope {
	fn from(val: TreeReadScope) -> Self {
		use gramaxgit::commands::TreeReadScope;

		let name = val.reference.unwrap_or_default();
		match val.object_type {
			TreeReadScopeObjectType::Head => TreeReadScope::Head,
			TreeReadScopeObjectType::Commit => TreeReadScope::Commit { commit: name },
			TreeReadScopeObjectType::Reference => TreeReadScope::Reference { reference: name },
		}
	}
}
