use test_utils::git::*;
use test_utils::*;

#[rstest]
fn commit(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["file"].iter())?;
  repo.commit("Hi!")?;

  let mut revwalk = repo.repo().revwalk()?;
  revwalk.push_head()?;
  let last_commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
  last_commit.tree()?.get_path(Path::new("file"))?;
  assert_eq!(last_commit.message().unwrap(), "Hi!");

  Ok(())
}

#[rstest]
fn commit_with_parents(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  repo.new_branch("test")?;
  repo.new_branch("test2")?;

  repo.checkout("master", true)?;
  let oid = repo.commit_with_parents("message", vec!["test".to_string(), "test2".to_string()])?;
  assert_eq!(repo.repo().find_commit(oid)?.parent_count(), 2);
  Ok(())
}

#[rstest]
fn commit_no_modified(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content").unwrap();
  assert!(repo.commit("Test").is_ok());
  Ok(())
}

#[rstest]
fn commit_with_parents_on_remote(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  repos.local.new_branch("test")?;
  repos.local.push()?;

  repos.local.checkout("master", true)?;
  let parents = vec!["master".to_string(), "origin/test".to_string()];
  let oid = repos.local.commit_with_parents("message", parents)?;
  assert_eq!(repos.local.repo().find_commit(oid)?.parent_count(), 2);
  Ok(())
}
