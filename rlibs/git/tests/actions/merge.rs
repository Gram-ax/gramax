use test_utils::git::*;
use test_utils::*;

#[rstest]
fn fastforward_merge(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
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
fn normal_merge_no_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
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
fn normal_merge_with_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
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

  let Ok(MergeResult::Conflicts(conflicts)) = repo.merge("dev") else { panic!("conflict was expected") };
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

  Ok(())
}

#[rstest]
fn merge_with_rename(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  let path = sandbox.path();
  let file = Path::new("file");
  let file_2 = Path::new("file-2");

  fs::write(path.join(file), "qwer\nqwer\nqwer\nqwer\n")?;
  repo.add(file)?;
  repo.commit("1")?;

  repo.new_branch("branch-2")?;
  fs::write(path.join(file_2), "123\nqwer\nqwer\nqwer\nqwer\n")?;
  fs::remove_file(path.join(file))?;
  repo.add_glob(["."].iter())?;
  repo.commit("2")?;

  assert!(!path.join(file).exists());
  assert!(path.join(file_2).exists());

  repo.checkout("master", false)?;

  assert!(path.join(file).exists());
  assert!(!path.join(file_2).exists());

  fs::write(path.join(file), "456\nqwer\nqwer\nqwer\nqwer\n")?;
  repo.add(file)?;
  repo.commit("3")?;

  let Ok(MergeResult::Conflicts(res)) = repo.merge("branch-2") else { panic!("merge conflict was expected") };

  let mut res = res.into_iter();
  assert_eq!(res.next().unwrap().ours, Some(PathBuf::from("file")));
  assert_eq!(res.next().unwrap().theirs, Some(PathBuf::from("file-2")));

  assert_eq!(
    fs::read_to_string(path.join(file_2))?,
    "<<<<<<< ours:file\n456\n=======\n123\n>>>>>>> theirs:file-2\nqwer\nqwer\nqwer\nqwer\n"
  );
  assert!(!path.join(file).exists());

  Ok(())
}
