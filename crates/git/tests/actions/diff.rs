use test_utils::git::*;
use test_utils::*;

#[rstest]
fn diff_head2workdir(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(vec!["file"])?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file2"), "content2")?;
  fs::write(sandbox.path().join("file"), "qwer")?;

  repo.add_glob(vec!["file", "file2"])?;

  let opts = DiffConfig { compare: DiffCompareOptions::Tree2Workdir { tree: None }, renames: false };

  let diff = repo.diff(opts)?;

  assert!(diff.has_changes);
  assert_eq!(diff.added, 2);
  assert_eq!(diff.deleted, 1);
  assert_eq!(diff.files.len(), 2);

  let file1 = &diff.files[0];
  assert_eq!(file1.path, PathBuf::from("file"));
  assert_eq!(file1.old_path, Some(PathBuf::from("file")));
  assert_eq!(file1.status, StatusEntry::Modified);
  assert_eq!(file1.added, 1);
  assert_eq!(file1.deleted, 1);

  let file2 = &diff.files[1];
  assert_eq!(file2.path, PathBuf::from("file2"));
  assert_eq!(file2.old_path, Some(PathBuf::from("file2")));
  assert_eq!(file2.status, StatusEntry::New);
  assert_eq!(file2.added, 1);
  assert_eq!(file2.deleted, 0);

  Ok(())
}

#[rstest]
fn diff_head2workdir_with_renames(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content\ncontent\ncontent\ncontent")?;
  repo.add("file")?;
  repo.commit_debug()?;

  fs::write(sandbox.path().join("file2"), "content\ncontent\n123\ncontent")?;
  fs::remove_file(sandbox.path().join("file"))?;

  repo.add_glob(vec!["file2", "file"])?; // ! Important to add to index first

  let opts = DiffConfig { compare: DiffCompareOptions::Tree2Workdir { tree: None }, renames: true };
  let diff = repo.diff(opts)?;

  assert!(diff.has_changes);
  assert_eq!(diff.files.len(), 1);
  assert_eq!(diff.files[0].path, PathBuf::from("file2"));
  assert_eq!(diff.files[0].old_path, Some(PathBuf::from("file")));
  assert_eq!(diff.files[0].status, StatusEntry::Rename);

  Ok(())
}

#[rstest]
fn diff_tree2tree(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add("file")?;
  repo.commit_debug()?;

  repo.new_branch("feature")?;
  repo.checkout("feature", true)?;

  fs::write(sandbox.path().join("file"), "new content")?;
  repo.add("file")?;
  repo.commit_debug()?;

  repo.checkout("master", true)?;

  let master_commit = repo.repo().head()?.peel_to_commit()?;
  let feature_commit = repo.repo().find_commit(repo.repo().refname_to_id("refs/heads/feature")?)?;

  let opts = DiffConfig {
    compare: DiffCompareOptions::Tree2Tree {
      new: OidInfo::from(&feature_commit.id()),
      old: OidInfo::from(&master_commit.id()),
    },
    renames: false,
  };

  let diff = repo.diff(opts)?;

  assert!(diff.has_changes);
  assert_eq!(diff.added, 1);
  assert_eq!(diff.deleted, 1);
  assert_eq!(diff.files.len(), 1);

  let file = &diff.files[0];
  assert_eq!(file.path, PathBuf::from("file"));
  assert_eq!(file.old_path, Some(PathBuf::from("file")));
  assert_eq!(file.status, StatusEntry::Modified);
  assert_eq!(file.added, 1);
  assert_eq!(file.deleted, 1);

  Ok(())
}

#[rstest]
fn diff_tree2index(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
    fs::write(sandbox.path().join("file"), "content")?;
    repo.add("file")?;
    repo.commit_debug()?;

    let commit = repo.repo().head()?.peel_to_commit()?;

    fs::write(sandbox.path().join("file"), "modified content")?;
    repo.add("file")?;

    let opts = DiffConfig {
        compare: DiffCompareOptions::Tree2Index {
            tree: Some(OidInfo::from(&commit.id())),
        },
        renames: false,
    };

    let diff = repo.diff(opts)?;

    assert!(diff.has_changes);
    assert_eq!(diff.added, 1);
    assert_eq!(diff.deleted, 1);
    assert_eq!(diff.files.len(), 1);

    let file = &diff.files[0];
    assert_eq!(file.path, PathBuf::from("file"));
    assert_eq!(file.old_path, Some(PathBuf::from("file")));
    assert_eq!(file.status, StatusEntry::Modified);
    assert_eq!(file.added, 1);
    assert_eq!(file.deleted, 1);

    Ok(())
}

#[rstest]
fn diff_tree2workdir(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
    fs::write(sandbox.path().join("file"), "content")?;
    repo.add("file")?;
    repo.commit_debug()?;

    let commit = repo.repo().head()?.peel_to_commit()?;
    
    fs::write(sandbox.path().join("file"), "modified content")?;

    let opts = DiffConfig {
        compare: DiffCompareOptions::Tree2Workdir { tree: Some(OidInfo::from(&commit.id())) },
        renames: false,
    };

    let diff = repo.diff(opts)?;

    assert!(diff.has_changes);
    assert_eq!(diff.added, 1);
    assert_eq!(diff.deleted, 1);
    assert_eq!(diff.files.len(), 1);

    let file = &diff.files[0];
    assert_eq!(file.path, PathBuf::from("file"));
    assert_eq!(file.old_path, Some(PathBuf::from("file")));
    assert_eq!(file.status, StatusEntry::Modified);
    assert_eq!(file.added, 1);
    assert_eq!(file.deleted, 1);

    Ok(())
}

