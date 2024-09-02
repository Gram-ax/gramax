use gramaxgit::prelude::*;

use rstest::*;
use tempdir::*;

use std::fs;

use test_utils::git::*;
use test_utils::*;

#[rstest]
fn init_new(sandbox: TempDir) -> Result {
  Repo::init(sandbox.path(), TestCreds)?;
  assert!(sandbox.path().join(".git").exists());
  Ok(())
}

#[rstest]
fn get_content(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
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

#[rstest]
fn file_history(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "init")?;
  repo.add("file")?;
  repo.commit("commit_1")?;
  fs::write(sandbox.path().join("file"), "222")?;
  repo.commit("commit 2")?;
  fs::write(sandbox.path().join("file_2"), "init")?;
  repo.add("file_2")?;
  repo.commit("commit 3")?;

  let diff = repo.history("file", 10)?;

  assert_eq!(diff.len(), 1);
  Ok(())
}

#[rstest]
fn file_history_with_rename(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\ninit")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 1")?;

  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n123")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 2")?;

  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n222")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 3")?;

  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n333")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 4")?;

  fs::write(sandbox.path().join("file_2"), "init\ninit\ninit\ninit\n555")?;
  fs::remove_file(sandbox.path().join("file"))?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 5")?;

  fs::write(sandbox.path().join("file_2"), "init\ninit\ninit\ninit\n666")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 6")?;

  fs::write(sandbox.path().join("file_3"), "init\ninit\ninit\ninit\n777")?;
  fs::remove_file(sandbox.path().join("file_2"))?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 6")?;

  let diff = repo.history("file_3", 10)?;

  assert_eq!(diff.len(), 7);

  Ok(())
}
