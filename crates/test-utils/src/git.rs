pub use gramaxgit::ext::*;
pub use gramaxgit::file_lock::*;
pub use gramaxgit::prelude::*;

use std::fs;
use std::path::PathBuf;
use std::rc::Rc;

pub use gramaxgit::creds::ActualCreds;
pub use gramaxgit::creds::Creds;
pub use gramaxgit::git2::Signature;
use rstest::fixture;
use tempdir::TempDir;

use crate::sandbox;

pub type Result<T = ()> = std::result::Result<T, gramaxgit::error::Error>;

#[derive(Debug, Clone)]
pub struct TestCreds;

impl Creds for TestCreds {
	fn signature(&self) -> std::result::Result<Signature<'_>, gramaxgit::git2::Error> {
		Signature::now("test-user", "test@email.com")
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

impl ActualCreds for TestCreds {}

#[fixture]
pub fn repo(#[default(&sandbox())] sandbox: &TempDir, #[default("")] url: &str) -> Repo<'static, TestCreds> {
	if url.is_empty() {
		Repo::init(sandbox.path(), TestCreds).unwrap()
	} else {
		Repo::clone(
			TestCreds,
			CloneOptions {
				url: url.to_string(),
				to: sandbox.path().to_path_buf(),
				branch: Some("master".to_string()),
				is_bare: false,
				allow_non_empty_dir: false,
				depth: None,
				cancel_token: 0,
				skip_lfs_pull: false,
			},
			Rc::new(|_| {}),
		)
		.unwrap();

		Repo::open(sandbox.path(), TestCreds).unwrap()
	}
}

pub struct Repos {
	pub local: Repo<'static, TestCreds>,
	pub local_path: PathBuf,
	pub remote: Repo<'static, TestCreds>,
	pub remote_path: PathBuf,
}

#[fixture]
pub fn repos(#[default(&sandbox())] sandbox: &TempDir) -> Repos {
	let local_path = sandbox.path().join("local");
	let remote_path = sandbox.path().join("remote");

	fs::create_dir(&local_path).unwrap();
	fs::create_dir(&remote_path).unwrap();

	let remote = Repo::init(&remote_path, TestCreds).unwrap();
	remote.repo().config().unwrap().set_bool("core.bare", true).unwrap();
	Repo::clone(
		TestCreds,
		CloneOptions {
			url: remote_path.to_string_lossy().to_string(),
			to: local_path.to_path_buf(),
			branch: Some("master".to_string()),
			is_bare: false,
			depth: None,
			allow_non_empty_dir: false,
			cancel_token: 0,
			skip_lfs_pull: false,
		},
		Rc::new(|_| {}),
	)
	.unwrap();

	let local = Repo::open(&local_path, TestCreds).unwrap();

	Repos {
		local,
		local_path,
		remote,
		remote_path,
	}
}
