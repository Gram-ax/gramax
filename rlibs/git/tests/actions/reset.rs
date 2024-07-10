use test_utils::git::*;
use test_utils::*;

#[rstest]
fn reset(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
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
fn restore(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
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
