use test_utils::git::*;
use test_utils::*;

#[rstest]
fn stash_without_conflict(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();

  fs::write(path.join("file"), "test\ntest\ntest\ntest\ntest")?;
  repo.add("file")?;
  repo.commit("1")?;

  fs::write(path.join("file"), "test\n123\n123\ntest\ntest")?;
  repo.add("file")?;

  let oid = repo.stash(None)?.unwrap();
  let apply_result = repo.stash_apply(oid)?;
  assert!(matches!(apply_result, MergeResult::Ok));

  assert_eq!(fs::read_to_string(path.join("file"))?, "test\n123\n123\ntest\ntest");

  Ok(())
}

#[rstest]
fn conflict(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  let file = path.join("file");
  fs::write(&file, "content")?;
  repo.add("file")?;
  repo.commit("1")?;

  fs::write(&file, "222")?;
  repo.add("file")?;

  let stash = repo.stash(None)?.unwrap();
  fs::write(&file, "444")?;
  repo.add("file")?;
  repo.commit("f")?;

  let MergeResult::Conflicts(conflicts) = repo.stash_apply(stash)? else { panic!("conflict was expected") };

  assert_eq!(conflicts.first().unwrap().ours, Some(PathBuf::from("file")));
  assert_eq!(
    fs::read_to_string(file)?,
    "<<<<<<< Updated upstream\n444\n=======\n222\n>>>>>>> Stashed changes\n"
  );

  Ok(())
}

#[rstest]
fn rename_file(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  let file = path.join("file");
  let file_renamed = path.join("file_renamed");
  fs::write(&file, "init content")?;
  repo.add("file")?;
  repo.commit("init")?;

  fs::rename(&file, file.with_file_name(&file_renamed))?;
  repo.add_glob(["*"].iter())?;
  assert!(!file.exists());
  assert!(file_renamed.exists());

  let stash = repo.stash(None)?.unwrap();
  assert!(file.exists());
  assert!(!file_renamed.exists());

  fs::remove_file(&file)?;
  repo.add_glob(["*"].iter())?;
  repo.commit("2")?;

  assert!(!file.exists());
  assert!(!file_renamed.exists());

  repo.stash_apply(stash)?;

  assert!(file_renamed.exists());

  assert_eq!(fs::read_to_string(file.with_file_name("file_renamed"))?, "init content");

  Ok(())
}

#[rstest]
fn get_parent(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  let file = path.join("file");
  fs::write(file, "content")?;
  let commit = repo.repo().head()?.peel_to_commit()?.id();
  repo.add("file")?;
  let stash = repo.stash(None)?.unwrap();
  let parent = repo.parent_of(stash)?;

  assert_eq!(Some(commit), parent);

  Ok(())
}

#[rstest]
fn move_n_modify(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  fs::write(path.join("file"), "test\ntest\ntest")?;
  repo.add("file")?;
  repo.commit("1")?;

  fs::write(path.join("file-moved"), "test\nfff\ntest\ntest\ntest")?;
  repo.add("file")?;
  repo.add("file-moved")?;
  let oid = repo.stash(None)?.unwrap();
  fs::write(path.join("file"), "ffffdsafsdafa\ntest\ntest\ntest\ntest")?;
  repo.add("file")?;
  repo.commit("2")?;

  assert!(repo.stash_apply(oid).is_ok());

  Ok(())
}

#[rstest]
#[allow(unused)]
fn add_same_file(sandbox: TempDir, #[with(&sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  fs::write(path.join("file"), "test\ntest\ntest\ntest\ntest")?;
  repo.add("file")?;
  let oid = repo.stash(None)?.unwrap();

  fs::write(path.join("file"), "fff\nfff\nfff\nttt\nttt")?;
  repo.add("file")?;
  repo.commit("1")?;

  let res = repo.stash_apply(oid)?;
  let expected = MergeResult::Conflicts(Vec::from([MergeConflictInfo {
    ours: Some("file".into()),
    theirs: Some("file".into()),
    ancestor: None,
  }]));

  assert!(matches!(res, expected));

  assert_eq!(fs::read_to_string(path.join("file"))?, "<<<<<<< Updated upstream\nfff\nfff\nfff\nttt\nttt\n=======\ntest\ntest\ntest\ntest\ntest\n>>>>>>> Stashed changes\n");

  Ok(())
}

#[rstest]
fn no_stash(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let res = repo.stash(None);
  assert!(matches!(res, Ok(None)));
  Ok(())
}
