use test_utils::git::*;
use test_utils::*;

#[rstest]
fn no_remotes(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  assert!(!(repo.has_remotes()?));
  Ok(())
}

#[rstest]
fn add_remote(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  repo.add_remote("origin", "https://someurl.com/")?;
  assert!(repo.has_remotes()?);
  Ok(())
}

#[rstest]
#[case("https://github.com/gram-ax/gramax-catalog-template")]
fn clone(sandbox: TempDir, #[case] url: &str) -> Result {
  use std::cell::RefCell;
  use std::rc::Rc;

  let sideband_calls = Rc::new(RefCell::new(0));
  let transfer_calls = Rc::new(RefCell::new(0));
  let sideband_calls_clone = Rc::clone(&sideband_calls);
  let transfer_calls_clone = Rc::clone(&transfer_calls);
  Repo::clone(
    TestCreds,
    CloneOptions {
      url: url.to_string(),
      to: sandbox.path().to_path_buf(),
      branch: None,
      depth: None,
      is_bare: false,
    },
    Box::new(move |progress| match progress {
      CloneProgress::Sideband { .. } => {
        *sideband_calls_clone.borrow_mut() += 1;
      }
      CloneProgress::ChunkedTransfer { .. } => {
        *transfer_calls_clone.borrow_mut() += 1;
      }
    }),
  )?;
  assert!(sandbox.path().join(".git").exists());
  assert!(*sideband_calls.borrow() > 0);
  assert!(*transfer_calls.borrow() > 0);
  Ok(())
}

#[rstest]
fn clone_empty(sandbox: TempDir) -> Result {
  let path = sandbox.path();
  git2::Repository::init(path.join("remote"))?;
  let repo = Repo::clone(
    TestCreds,
    CloneOptions {
      url: path.join("remote").to_str().unwrap().to_string(),
      to: path.join("clone"),
      branch: None,
      depth: None,
      is_bare: false,
    },
    Box::new(|_| {}),
  )?;
  assert!(repo.repo().branches(Some(BranchType::Local))?.count() == 1);
  assert_eq!(repo.repo().head()?.name().unwrap(), "refs/heads/master");
  Ok(())
}

#[rstest]
fn push(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  fs::write(repos.local_path.join("file"), "content")?;
  assert!(repos.local_path.join("file").exists());
  assert!(!repos.remote_path.join("file").exists());

  repos.local.repo().remote_delete("origin")?;
  repos.local.add_remote("origin", repos.remote_path.display().to_string())?;

  repos.local.new_branch("test")?;

  repos.local.add_glob(["."].iter())?;
  repos.local.commit("test")?;
  repos.local.push()?;

  repos.remote.checkout("test", false)?;
  let commit = repos.remote.repo().head()?.peel_to_commit()?;

  commit.tree()?.get_path(Path::new("file"))?;
  assert_eq!(commit.message().unwrap(), "test");
  Ok(())
}

#[rstest]
fn mismatch_history(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  fs::write(repos.remote_path.join("file"), "content")?;
  repos.remote.add_glob(["."].iter())?;
  repos.remote.commit("remote commit")?;

  assert!(repos.local.push().is_err());
  Ok(())
}

#[rstest]
fn fetch(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  fs::write(repos.remote_path.join("file"), "content")?;
  repos.remote.new_branch("test")?;
  repos.remote.add_glob(["."].iter())?;
  repos.remote.commit("remote commit")?;

  assert!(!repos.local.branches(None)?.any(|b| b.unwrap().0.name().unwrap().unwrap() == "origin/test"));
  repos.local.fetch(false)?;
  repos.local.checkout("test", false)?;
  assert_eq!(repos.local.branch_by_head()?.name()?.unwrap(), "test");
  assert!(repos.local.branches(None)?.any(|b| b.unwrap().0.name().unwrap().unwrap() == "test"));
  Ok(())
}

#[rstest]
fn auto_add_remote_postfix(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let url = "https://github.com/gram-ax/gramax-catalog-template";
  repo.add_remote("origin", url)?;
  repo.fetch(false)?;
  assert!(repo.has_remotes()?);
  assert_eq!(repo.get_remote()?, Some(format!("{}.git", url)));

  Ok(())
}
