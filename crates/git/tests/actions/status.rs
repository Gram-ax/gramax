use test_utils::git::*;
use test_utils::*;

#[rstest]
fn status(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file1"), "123")?;
  repo.add("file1")?;
  repo.commit_debug()?;

  let file_deleted_path = fs::read_dir(sandbox.path())?.next().unwrap().unwrap().path();
  let file_deleted_name = file_deleted_path.strip_prefix(sandbox.path()).unwrap();
  repo.add_all()?;
  fs::write(sandbox.path().join("new_file"), "123")?;
  fs::remove_file(&file_deleted_path)?;
  fs::create_dir(sandbox.path().join("dir"))?;

  let status = repo.status(false)?.short_info()?;

  assert_eq!(
    status.entries().find(|e| e.path == Path::new("new_file")).map(|e| e.status),
    Some(StatusEntry::New)
  );
  assert_eq!(
    status.entries().find(|e| e.path == file_deleted_name).map(|e| e.status),
    Some(StatusEntry::Delete)
  );

  let status_file = repo.status_file("new_file")?;
  assert_eq!(status_file, StatusEntry::New);

  Ok(())
}

#[rstest]
fn status_with_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  fs::write(path.join("file"), "init")?;
  repo.add("file")?;
  repo.commit_debug()?;

  repo.new_branch("dev")?;
  repo.checkout("dev", false)?;
  fs::write(path.join("file"), "dev\nd")?;
  repo.add("file")?;
  repo.commit_debug()?;

  repo.checkout("master", false)?;
  fs::write(path.join("file"), "master\nd")?;
  repo.add("file")?;
  repo.commit_debug()?;

  let Ok(MergeResult::Conflicts(conflicts)) = repo.merge(MergeOptions::theirs("dev")) else { panic!("conflict was expected") };
  let conflict = conflicts.first().unwrap();
  assert_eq!(conflict.ours, conflict.theirs);
  assert_eq!(conflict.theirs, conflict.ancestor);
  assert_eq!(conflict.ancestor, Some(PathBuf::from("file")));

  const EXPECTED: &str = r#"<<<<<<< ours
master
=======
dev
>>>>>>> theirs
d"#;

  assert_eq!(fs::read_to_string(path.join("file"))?, EXPECTED);

  let conflicts = repo.conflicts()?;
  assert_eq!(conflicts.len(), 1);
  assert_eq!(
    String::from_utf8(conflicts.first().unwrap().our.as_ref().unwrap().path.clone()).unwrap(),
    "file"
  );

  repo.add_all()?;

  let conflicts = repo.conflicts()?;
  assert_eq!(conflicts.len(), 1);
  assert_eq!(
    String::from_utf8(conflicts.first().unwrap().our.as_ref().unwrap().path.clone()).unwrap(),
    "file"
  );

  Ok(())
}
