use gramaxgit::prelude::*;

use rstest::*;
use tempdir::*;

use std::fs;

use test_utils::git::*;
use test_utils::*;

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

  fs::write(sandbox.path().join("file_3"), "init\ninit\ninit\ninit\n666")?;
  fs::remove_file(sandbox.path().join("file_2"))?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 6")?;

  fs::write(sandbox.path().join("file_4"), "init\ninit\ninit\ninit\n777")?;
  fs::remove_file(sandbox.path().join("file_3"))?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 7")?;

  let diff = dbg!(repo.history("file_4", 10)?);

  assert_eq!(diff.len(), 8);

  Ok(())
}
