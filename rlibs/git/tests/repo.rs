use git2::BranchType;
use gramaxgit::creds::*;
use gramaxgit::prelude::*;
use gramaxgit::ShortInfo;

use gramaxgit::repo_ext::RepoExt;
use gramaxgit::status::Status;
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
fn init_new(sandbox: TempDir) -> Result {
  Repo::init(sandbox.path(), DummyCreds)?;
  assert!(sandbox.path().join(".git").exists());
  Ok(())
}

#[rstest]
fn branch_info(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<DummyCreds>) -> Result {
  let branch = repo.branch_by_head()?;
  let info = branch.short_info()?;
  assert_eq!(info.name, "master");
  assert_eq!(info.remote_name, None);
  assert_eq!(info.last_author_name, "Test");
  Ok(())
}

#[rstest]
fn branch_info_by_name(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<DummyCreds>) -> Result {
  let branch = repo.branch_by_name("master", BranchType::Local)?;
  let info = branch.short_info()?;
  assert_eq!(info.name, "master");
  Ok(())
}

#[rstest]
fn create_branch(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<DummyCreds>) -> Result {
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
fn delete_branch(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<DummyCreds>) -> Result {
  repo.new_branch("test")?;
  repo.new_branch("test2")?;
  repo.delete_branch("test", BranchType::Local)?;

  assert_eq!(repo.repo().branches(None)?.count(), 2);
  Ok(())
}

#[rstest]
fn add_and_commit(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
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
fn commit_with_parents(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<DummyCreds>) -> Result {
  repo.new_branch("test")?;
  repo.new_branch("test2")?;

  repo.checkout("master", true)?;
  let oid = repo.commit_with_parents("message", vec!["test".to_string(), "test2".to_string()])?;
  assert_eq!(repo.repo().find_commit(oid)?.parent_count(), 2);
  Ok(())
}

#[rstest]
fn no_modified_commit(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content").unwrap();
  assert!(repo.commit("Test").is_ok());
  Ok(())
}

#[rstest]
fn file_history(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
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
fn reset(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  let file_path = sandbox.path().join("file");
  fs::write(sandbox.path().join("file2"), "contents")?;
  repo.add("file2")?;
  repo.commit("q")?;

  fs::write(&file_path, "init")?;
  repo.add("file")?;

  assert!(file_path.exists());
  repo.reset_all(true, None)?;
  assert!(!file_path.exists());

  fs::write(&file_path, "init")?;
  repo.add("file")?;
  repo.commit("commit_1")?;
  fs::write(&file_path, "qwer")?;

  repo.reset_all(true, None)?;

  assert!(!file_path.exists());
  Ok(())
}

#[rstest]
fn status(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  fs::write(sandbox.path().join("file1"), "123")?;
  repo.add("file1")?;
  repo.commit("init")?;

  let file_deleted_path = fs::read_dir(sandbox.path())?.next().unwrap().unwrap().path();
  let file_deleted_name = file_deleted_path.strip_prefix(sandbox.path()).unwrap();
  repo.add_glob(["."].iter())?;
  fs::write(sandbox.path().join("new_file"), "123")?;
  fs::remove_file(&file_deleted_path)?;

  let status = repo.status()?.short_info()?;

  assert_eq!(
    status.entries().find(|e| e.path == Path::new("new_file")).map(|s| s.status.clone()),
    Some(Status::New)
  );

  assert_eq!(
    status.entries().find(|e| e.path == file_deleted_name).map(|s| s.status.clone()),
    Some(Status::Delete)
  );

  let status_file = repo.status_file("new_file")?;
  assert_eq!(status_file, Status::New);

  Ok(())
}

#[rstest]
fn fastforward_merge(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  let path = sandbox.path().join("file");
  fs::write(&path, "content")?;
  repo.new_branch("other")?;
  repo.add_glob(["."].iter())?;
  repo.commit("x")?;
  fs::write(&path, "content222")?;
  repo.add_glob(["."].iter())?;
  repo.commit("y")?;

  assert!(path.exists());
  repo.checkout("master", false)?;
  assert!(!path.exists());
  repo.merge("other")?;
  assert!(path.exists());
  assert_eq!(fs::read_to_string(path)?, "content222");

  let mut revwalk = repo.repo().revwalk()?;
  revwalk.push_head()?;

  for (oid, &commit_msg) in revwalk.zip(["init", "x", "y"].iter().rev()) {
    let commit = repo.repo().find_commit(oid?)?;
    assert_eq!(commit.message().unwrap(), commit_msg)
  }

  Ok(())
}

#[rstest]
fn normal_merge_no_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  let path = sandbox.path();
  fs::write(path.join("file1"), "123")?;
  repo.add("file1")?;
  repo.commit("master1")?;

  repo.new_branch("dev")?;
  fs::write(path.join("file2"), "123")?;
  repo.add("file2")?;
  repo.commit("dev1")?;

  repo.checkout("master", false)?;
  fs::write(path.join("file3"), "file3")?;
  repo.add("file3")?;
  repo.commit("master2")?;

  repo.merge("dev")?;

  let mut revwalk = repo.repo().revwalk()?;
  revwalk.push_head()?;

  let merge_commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
  assert_eq!(merge_commit.parent_count(), 2);
  let commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
  assert_eq!(commit.message().unwrap(), "master2");
  let commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
  assert_eq!(commit.message().unwrap(), "dev1");

  Ok(())
}

#[rstest]
fn normal_merge_with_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  let path = sandbox.path();
  fs::write(path.join("file"), "init")?;
  repo.add("file")?;
  repo.commit("1")?;

  repo.new_branch("dev")?;
  repo.checkout("dev", false)?;
  fs::write(path.join("file"), "dev\nd")?;
  repo.add("file")?;
  repo.commit("2")?;

  repo.checkout("master", false)?;
  fs::write(path.join("file"), "master\nd")?;
  repo.add("file")?;
  repo.commit("3")?;

  let should_be_err = repo.merge("dev").is_err();
  assert!(should_be_err);

  const EXPECTED: &str = r#"<<<<<<< ours
master
=======
dev
>>>>>>> theirs
d"#;

  assert_eq!(fs::read_to_string(path.join("file"))?, EXPECTED);

  Ok(())
}

#[rstest]
fn restore(sandbox: TempDir, #[with(&sandbox)] repo: Repo<DummyCreds>) -> Result {
  let path = sandbox.path();
  let file1 = path.join("file1");
  let file2 = path.join("file2");
  let file3 = path.join("file3");
  fs::write(&file1, "123")?;
  fs::write(&file2, "asdf")?;
  repo.add_glob(["."].iter())?;
  repo.commit("1234")?;

  fs::write(&file1, "333")?;
  fs::write(&file2, "123")?;
  fs::write(&file3, "contents")?;
  repo.add("file3")?;

  repo.restore(["file1", "file2", "file3"].iter(), false)?;

  assert_eq!(fs::read_to_string(file1)?, "123");
  assert_eq!(fs::read_to_string(file2)?, "asdf");
  assert!(!&file3.exists());

  Ok(())
}

#[rstest]
fn stash_with_confict(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<DummyCreds>) -> Result {
  let path = sandbox.path();
  let file = path.join("file");
  fs::write(&file, "content")?;
  repo.add("file")?;
  repo.commit("1")?;

  fs::write(&file, "222")?;
  repo.add("file")?;

  let stash = repo.stash(None)?;
  fs::write(&file, "444")?;

  repo.stash_apply(stash)?;

  assert_eq!(fs::read_to_string(file)?, "444");
  Ok(())
}

#[rstest]
fn stash_parent(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<DummyCreds>) -> Result {
  let path = sandbox.path();
  let file = path.join("file");
  fs::write(file, "content")?;
  let commit = repo.repo().head()?.peel_to_commit()?.id();
  repo.add("file")?;
  let stash = repo.stash(None)?;
  let parent = repo.parent_of(stash)?;

  assert_eq!(Some(commit), parent);

  Ok(())
}
