pub mod count_changed_files;
pub mod file_lock;
pub mod gc;
pub mod healthcheck;
pub mod history;
pub mod merge_requests;
pub mod read_tree;

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
  repo.add_all()?;
  let (oid, _) = repo.commit_debug()?;
  fs::write(sandbox.path().join("file"), "content231")?;
  repo.add_all()?;
  repo.commit_debug()?;

  assert_eq!(repo.get_content("file", Some(oid))?, "content");
  assert_eq!(repo.get_content("file", None)?, "content231");

  Ok(())
}
