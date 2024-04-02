use gramaxgit::creds::*;
use gramaxgit::prelude::repo_ext::*;
use gramaxgit::prelude::*;

use rstest::*;
use tempdir::*;

use std::fs;
use std::path::Path;

type Result = std::result::Result<(), gramaxgit::error::Error>;

#[fixture]
fn sandbox() -> TempDir {
  let path = Path::new(env!("CARGO_TARGET_TMPDIR")).join("gramax-git");
  std::fs::create_dir_all(&path).unwrap();
  TempDir::new_in(path, "repo").unwrap()
}

#[fixture]
fn repo(#[default(&sandbox())] sandbox: &TempDir, #[default("")] url: &str) -> Repo<DummyCreds> {
  if url.is_empty() {
    Repo::init(sandbox.path(), DummyCreds).unwrap()
  } else {
    Repo::clone(url, sandbox.path(), Some("master"), DummyCreds, |_, _| true).unwrap()
  }
}

#[rstest]
fn get_content(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["."].iter())?;
  let oid = repo.commit("test")?;
  fs::write(sandbox.path().join("file"), "content231")?;
  repo.add_glob(["."].iter())?;
  repo.commit("test")?;

  assert_eq!(repo.get_content("file", Some(oid))?, "content");
  assert_eq!(repo.get_content("file", None)?, "content231");

  Ok(())
}
