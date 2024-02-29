use std::fs;
use std::path::Path;
use std::path::PathBuf;

use gramaxgit::creds::DummyCreds;
use gramaxgit::repo::GitRepository;
use gramaxgit::repo::Repository;
use gramaxgit::ShortInfo;
use rstest::*;
use tempdir::TempDir;

type Result = std::result::Result<(), gramaxgit::error::Error>;

#[fixture]
fn sandbox() -> TempDir {
  let path = Path::new(env!("CARGO_TARGET_TMPDIR")).join("gramax-git");
  std::fs::create_dir_all(&path).unwrap();
  TempDir::new_in(path, "repo").unwrap()
}

#[fixture]
fn repo(#[default(&sandbox())] sandbox: &TempDir, #[default("")] url: &str) -> impl Repository<DummyCreds> {
  if url.is_empty() {
    GitRepository::init(sandbox.path(), DummyCreds).unwrap()
  } else {
    GitRepository::clone(url, sandbox.path(), Some("master"), DummyCreds, |_, _| true).unwrap()
  }
}

struct WithRemote {
  local: GitRepository<DummyCreds>,
  local_path: PathBuf,
  remote: GitRepository<DummyCreds>,
  remote_path: PathBuf,
}

#[fixture]
fn repos(#[default(&sandbox())] sandbox: &TempDir) -> WithRemote {
  let local_path = sandbox.path().join("local");
  let remote_path = sandbox.path().join("remote");

  fs::create_dir(&local_path).unwrap();
  fs::create_dir(&remote_path).unwrap();

  let remote = GitRepository::init(&remote_path, DummyCreds).unwrap();
  remote.repo().config().unwrap().set_bool("core.bare", true).unwrap();
  let local =
    GitRepository::clone(remote_path.to_string_lossy(), &local_path, Some("master"), DummyCreds, |_, _| true)
      .unwrap();

  WithRemote { local, local_path, remote, remote_path }
}

#[rstest]
fn with_no_remotes(_sandbox: TempDir, #[with(&_sandbox)] repo: impl Repository<DummyCreds>) -> Result {
  assert!(!(repo.has_remotes()?));
  Ok(())
}

#[rstest]
fn add_remote(_sandbox: TempDir, #[with(&_sandbox)] repo: impl Repository<DummyCreds>) -> Result {
  repo.add_remote("origin", "https://someurl.com/")?;
  assert!(repo.has_remotes()?);
  Ok(())
}

#[rstest]
#[case("https://github.com/gram-ax/gramax-catalog-template")]
fn clone(sandbox: TempDir, #[case] url: &str) -> Result {
  let mut objects = 0;
  GitRepository::clone(url, sandbox.path(), None, DummyCreds, |_, _| {
    objects += 1;
    true
  })?;
  assert!(sandbox.path().join(".git").exists());
  assert!(objects > 0);
  Ok(())
}
#[rstest]
fn push(_sandbox: TempDir, #[with(&_sandbox)] repos: WithRemote) -> Result {
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
fn mismatch_history(_sandbox: TempDir, #[with(&_sandbox)] repos: WithRemote) -> Result {
  fs::write(repos.remote_path.join("file"), "content")?;
  repos.remote.add_glob(["."].iter())?;
  repos.remote.commit("remote commit")?;

  assert!(repos.local.push().is_err());
  Ok(())
}

#[rstest]
fn fetch(_sandbox: TempDir, #[with(&_sandbox)] repos: WithRemote) -> Result {
  fs::write(repos.remote_path.join("file"), "content")?;
  repos.remote.new_branch("test")?;
  repos.remote.add_glob(["."].iter())?;
  repos.remote.commit("remote commit")?;

  assert!(!repos.local.branches(None)?.any(|b| b.unwrap().0.name().unwrap().unwrap() == "origin/test"));
  repos.local.fetch()?;
  repos.local.checkout("test", false)?;
  assert_eq!(repos.local.branch_by_head()?.name()?.unwrap(), "test");
  assert!(repos.local.branches(None)?.any(|b| b.unwrap().0.name().unwrap().unwrap() == "test"));
  Ok(())
}

#[rstest]
fn delete_remote_branch(_sandbox: TempDir, #[with(&_sandbox)] repos: WithRemote) -> Result {
  repos.local.new_branch("test")?;
  repos.local.push()?;
  assert_eq!(repos.remote.branches(None)?.count(), 2);
  repos.local.delete_branch("master", git2::BranchType::Remote)?;
  assert_eq!(repos.remote.branches(None)?.count(), 1);
  Ok(())
}

#[rstest]
fn create_branch(_sandbox: TempDir, #[with(&_sandbox)] repos: WithRemote) -> Result {
  repos.local.new_branch("test")?;
  repos.local.push()?;
  assert!(repos.remote.branches(None)?.any(|b| b.unwrap().0.name().unwrap().unwrap() == "test"));
  let local = repos.local.branch_by_name("test", git2::BranchType::Local)?.short_info()?;
  assert_eq!(local.remote_name, Some("test".into()));
  Ok(())
}

#[rstest]
fn commit_with_parents(_sandbox: TempDir, #[with(&_sandbox)] repos: WithRemote) -> Result {
  repos.local.new_branch("test")?;
  repos.local.push()?;

  repos.local.checkout("master", true)?;
  let oid = repos.local.commit_with_parents("message", vec!["master", "origin/test"])?;
  assert_eq!(repos.local.repo().find_commit(oid)?.parent_count(), 2);
  Ok(())
}
