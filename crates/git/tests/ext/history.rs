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

#[rstest]
fn get_all_branch_commiters_with_limit(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "init")?;
  repo.add("file")?;
  repo.commit_debug()?;

  repo.new_branch("feature")?;

  for i in 1..=5 {
    fs::write(sandbox.path().join("file"), format!("feature{}", i))?;
    repo.add("file")?;
    repo.commit_debug()?;
  }

  let commiters = repo.get_branch_commits("master", "feature", Some(3))?;

  assert_eq!(commiters.authors.len(), 1, "should have 1 author");
  assert_eq!(commiters.authors[0].count, 3, "should have 3 commits");
  assert_eq!(commiters.commits.len(), 3, "should have 3 commits");

  Ok(())
}

#[rstest]
fn get_all_branch_commiters_with_target_branch(
  sandbox: TempDir,
  #[with(&sandbox)] repo: Repo<TestCreds>,
) -> Result {
  // create a new branch and make commits on it
  repo.new_branch("feature")?;

  // make 3 commits on feature branch
  for i in 1..=3 {
    fs::write(sandbox.path().join("file"), format!("feature{}", i))?;
    repo.add("file")?;
    repo.commit_debug()?;
  }

  repo.checkout("master", true)?;

  std::fs::write(sandbox.path().join("file"), "master commit")?;
  repo.add("file")?;
  repo.commit(CommitOptions { message: "master commit".to_string(), parent_refs: None, files: None })?;

  repo.checkout("feature", true)?;
  repo.merge(MergeOptions::theirs("master"))?;

  let commiters = repo.get_branch_commits("master", "feature", None)?;

  assert!(!commiters.commits.iter().any(|c| c == "master commit"));

  assert_eq!(commiters.authors.len(), 1, "should have 1 author");
  assert_eq!(commiters.authors[0].count, 3, "should have 3 commits (commits on feature)");
  assert_eq!(commiters.commits.len(), 3, "should have 3 commits (commits on feature)");

  Ok(())
}
