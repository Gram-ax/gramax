pub use gramaxgit::ext::*;
pub use gramaxgit::prelude::*;

use std::fs;
use std::path::PathBuf;
use std::sync::atomic::AtomicUsize;

pub use gramaxgit::creds::ActualCreds;
pub use gramaxgit::creds::Creds;
pub use gramaxgit::git2::Signature;
use rstest::fixture;
use tempdir::TempDir;

use crate::sandbox;

pub type Result = std::result::Result<(), gramaxgit::error::Error>;

static ATOMIC_COUNTER: AtomicUsize = AtomicUsize::new(0);

pub struct TestCreds;

impl Creds for TestCreds {
  fn signature(&self) -> std::result::Result<Signature, gramaxgit::git2::Error> {
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
pub fn repo(#[default(&sandbox())] sandbox: &TempDir, #[default("")] url: &str) -> Repo<TestCreds> {
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
        depth: None,
        cancel_token: ATOMIC_COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed),
      },
      Box::new(|_| {}),
    )
    .unwrap();

    Repo::open(sandbox.path(), TestCreds).unwrap()
  }
}

pub struct Repos {
  pub local: Repo<TestCreds>,
  pub local_path: PathBuf,
  pub remote: Repo<TestCreds>,
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
      cancel_token: ATOMIC_COUNTER.fetch_add(1, std::sync::atomic::Ordering::Relaxed),
    },
    Box::new(|_| {}),
  )
  .unwrap();

  let local = Repo::open(&local_path, TestCreds).unwrap();

  Repos { local, local_path, remote, remote_path }
}
