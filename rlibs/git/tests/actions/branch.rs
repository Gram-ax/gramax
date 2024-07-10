use test_utils::git::*;
use test_utils::*;

#[rstest]
fn get_branch_info(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let branch = repo.branch_by_head()?;
  let info = branch.short_info()?;
  assert_eq!(info.name, "master");
  assert_eq!(info.remote_name, None);
  assert_eq!(info.last_author_name, "test-user");
  Ok(())
}

#[rstest]
fn get_branch_info_by_name(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let branch = repo.branch_by_name("master", BranchType::Local)?;
  let info = branch.short_info()?;
  assert_eq!(info.name, "master");
  Ok(())
}

#[rstest]
fn create_branch(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  repo.new_branch("master2")?;
  repo.new_branch("x")?;

  let mut iter = repo.repo().branches(None)?;
  let mut next = || iter.next().unwrap().map(|b| b.0.name().unwrap().unwrap().to_owned()).unwrap();

  assert_eq!(next(), "master");
  assert_eq!(next(), "master2");
  assert_eq!(next(), "x");
  Ok(())
}

#[rstest]
fn create_branch_on_remote(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  repos.local.new_branch("test")?;
  repos.local.push()?;
  assert!(repos.remote.branches(None)?.any(|b| b.unwrap().0.name().unwrap().unwrap() == "test"));
  let local = repos.local.branch_by_name("test", git2::BranchType::Local)?.short_info()?;
  assert_eq!(local.remote_name, Some("test".into()));
  Ok(())
}

#[rstest]
fn delete_branch(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  repo.new_branch("test")?;
  repo.new_branch("test2")?;
  repo.delete_branch_local("test")?;

  assert_eq!(repo.repo().branches(None)?.count(), 2);
  Ok(())
}

#[rstest]
fn delete_branch_remote(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  repos.local.new_branch("test")?;
  repos.local.push()?;
  assert_eq!(repos.remote.branches(None)?.count(), 2);
  repos.local.delete_branch_remote("master")?;
  assert_eq!(repos.remote.branches(None)?.count(), 1);
  Ok(())
}
