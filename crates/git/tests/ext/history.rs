use gramaxgit::prelude::*;

use tempdir::*;

use std::fs;

use test_utils::git::*;
use test_utils::*;

#[rstest]
fn file_history(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "init")?;
  repo.add("file")?;
  repo.commit_debug()?;
  fs::write(sandbox.path().join("file"), "222")?;
  repo.commit_debug()?;
  repo.add("file")?;
  fs::write(sandbox.path().join("file_2"), "init")?;
  repo.add("file_2")?;
  repo.commit_debug()?;

  let diff = repo.history("file", 10)?;

  assert_eq!(diff.len(), 2);
  Ok(())
}

#[rstest]
fn file_history_with_rename(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\ninit")?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n123")?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n222")?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n333")?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file_2"), "init\ninit\ninit\ninit\n555")?;
  fs::remove_file(sandbox.path().join("file"))?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file_2"), "init\ninit\ninit\ninit\n666")?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file_3"), "init\ninit\ninit\ninit\n666")?;
  fs::remove_file(sandbox.path().join("file_2"))?;
  repo.add_all()?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file_4"), "init\ninit\ninit\ninit\n777")?;
  fs::remove_file(sandbox.path().join("file_3"))?;
  repo.add_all()?;
  repo.commit_debug()?;

  let diff = repo.history("file_4", 10)?;

  assert_eq!(diff.len(), 8);

  Ok(())
}
