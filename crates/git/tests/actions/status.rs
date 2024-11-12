use test_utils::git::*;
use test_utils::*;

#[rstest]
fn status(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file1"), "123")?;
  repo.add("file1")?;
  repo.commit("init")?;

  let file_deleted_path = fs::read_dir(sandbox.path())?.next().unwrap().unwrap().path();
  let file_deleted_name = file_deleted_path.strip_prefix(sandbox.path()).unwrap();
  repo.add_glob(["."].iter())?;
  fs::write(sandbox.path().join("new_file"), "123")?;
  fs::remove_file(&file_deleted_path)?;
  fs::create_dir(sandbox.path().join("dir"))?;

  let status = repo.status()?.short_info()?;

  assert_eq!(
    status.entries().find(|e| e.path == Path::new("new_file")).map(|s| s.status.clone()),
    Some(StatusEntry::New)
  );

  assert_eq!(
    status.entries().find(|e| e.path == file_deleted_name).map(|s| s.status.clone()),
    Some(StatusEntry::Delete)
  );

  let status_file = repo.status_file("new_file")?;
  assert_eq!(status_file, StatusEntry::New);

  Ok(())
}
