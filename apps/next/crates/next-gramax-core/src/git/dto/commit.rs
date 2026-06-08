use std::path::PathBuf;

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct CommitOptions {
	pub message: String,
	pub parent_refs: Option<Vec<String>>,
	pub files: Option<Vec<String>>,
}

impl From<CommitOptions> for gramaxgit::actions::commit::CommitOptions {
	fn from(val: CommitOptions) -> Self {
		gramaxgit::actions::commit::CommitOptions {
			message: val.message,
			parent_refs: val.parent_refs,
			files: val.files.map(|files| files.into_iter().map(PathBuf::from).collect()),
		}
	}
}

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct CommitFilterOptions {
	pub authors: Option<Vec<String>>,
	pub before_date: Option<String>,
	pub after_date: Option<String>,
	pub paths: Option<Vec<String>>,
}

#[napi(object, use_nullable = true)]
#[derive(Clone)]
pub struct CommitInfoOpts {
	pub depth: u32,
	pub simplify: bool,
	pub filters: Option<CommitFilterOptions>,
	pub include_changed_files: Option<bool>,
}

impl From<CommitInfoOpts> for gramaxgit::ext::history::CommitInfoOpts {
	fn from(val: CommitInfoOpts) -> Self {
		gramaxgit::ext::history::CommitInfoOpts {
			depth: val.depth as usize,
			simplify: val.simplify,
			filters: val.filters.map(|f| gramaxgit::ext::history::CommitFilterOptions {
				authors: f.authors,
				before_date: f.before_date,
				after_date: f.after_date,
				paths: f.paths,
			}),
			include_changed_files: val.include_changed_files,
		}
	}
}
