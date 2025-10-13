use crate::ext::walk::*;
use std::fs;
use test_utils::git::*;
use test_utils::*;

#[rstest]
fn healthcheck_clean_repository(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "initial content")?;
  repo.add(file_name)?;
  let (commit_oid, _) = repo.commit_debug()?;

  let bad_objects = repo.healthcheck()?;

  assert_eq!(bad_objects.len(), 0, "healthcheck should be ok");

  let commit = repo.repo().find_commit(commit_oid)?;
  let tree = commit.tree()?;

  assert!(repo.repo().find_object(commit.id(), None).is_ok());
  assert!(repo.repo().find_object(tree.id(), None).is_ok());

  Ok(())
}

#[rstest]
fn healthcheck_missing_blob(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "content for blob test")?;
  repo.add(file_name)?;
  let (commit_oid, _) = repo.commit_debug()?;

  let commit = repo.repo().find_commit(commit_oid)?;
  let tree = commit.tree()?;
  let blob_entry = tree.get_name(file_name).unwrap();
  let blob_id = blob_entry.id();

  drop(blob_entry);
  drop(tree);
  drop(commit);

  repo.debug_remove_object(&[blob_id])?;
  let bad_objects = repo.healthcheck()?;

  assert!(!bad_objects.is_empty(), "healthcheck should find corrupted objects");

  let found_bad_blob = bad_objects.iter().find(|obj| obj.oid == blob_id);
  assert!(found_bad_blob.is_some(), "blob {blob_id} should be corrupted");

  Ok(())
}

#[rstest]
fn healthcheck_missing_tree(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "content for tree test")?;
  repo.add(file_name)?;
  let (commit_oid, _) = repo.commit_debug()?;

  let commit = repo.repo().find_commit(commit_oid)?;
  let commit_id = commit.id();
  let tree_id = commit.tree_id();

  drop(commit);
  
  repo.debug_remove_object(&[tree_id])?;
  let bad_objects = repo.healthcheck()?;
  assert!(!bad_objects.is_empty(), "healthcheck should find corrupted objects");

  let found_bad_commit = bad_objects.iter().find(|obj| obj.oid == commit_id);
  assert!(found_bad_commit.is_some(), "commit {commit_id} should be corrupted; found: {bad_objects:?}");

  Ok(())
}

#[rstest]
fn healthcheck_missing_commit(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "first commit")?;
  repo.add(file_name)?;
  let (first_commit_oid, _) = repo.commit_debug()?;

  fs::write(_sandbox.path().join(file_name), "second commit")?;
  repo.add(file_name)?;
  repo.commit_debug()?;

  repo.debug_remove_object(&[first_commit_oid])?;
  let bad_objects = repo.healthcheck()?;

  assert!(!bad_objects.is_empty(), "healthcheck should find corrupted objects");

  let found_missing_parent =
    bad_objects.iter().find(|obj| matches!(obj.reason, BadObjectReason::MissingParent { .. }));
  assert!(found_missing_parent.is_some(), "should find object with missing parent");

  Ok(())
}

#[rstest]
fn healthcheck_missing_head(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "content")?;
  repo.add(file_name)?;
  let (commit_oid, _) = repo.commit_debug()?;

  repo.debug_remove_object(&[commit_oid])?;

  let bad_objects = repo.healthcheck()?;

  let found_missing_head = bad_objects.iter().find(|obj| matches!(obj.reason, BadObjectReason::MissingHead));
  assert!(found_missing_head.is_some(), "should find object with missing head");

  Ok(())
}

#[rstest]
fn healthcheck_multiple_corruptions(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let file1_name = "file1.txt";
  let file2_name = "file2.txt";

  fs::write(_sandbox.path().join(file1_name), "content 1")?;
  fs::write(_sandbox.path().join(file2_name), "content 2")?;
  repo.add_all()?;
  let (commit_oid, _) = repo.commit_debug()?;

  let commit = repo.repo().find_commit(commit_oid)?;
  let tree = commit.tree()?;
  let blob1_entry = tree.get_name(file1_name).unwrap();
  let blob2_entry = tree.get_name(file2_name).unwrap();
  let blob1_id = blob1_entry.id();
  let blob2_id = blob2_entry.id();

  drop(blob1_entry);
  drop(blob2_entry);
  drop(tree);
  drop(commit);

  repo.debug_remove_object(&[blob1_id, blob2_id])?;

  let bad_objects = repo.healthcheck()?;

  assert!(bad_objects.len() >= 2, "should find 2 corrupted objects but found: {}", bad_objects.len());

  let found_blob1 = bad_objects.iter().any(|obj| obj.oid == blob1_id);
  let found_blob2 = bad_objects.iter().any(|obj| obj.oid == blob2_id);

  assert!(found_blob1 || found_blob2, "should find >0 corrupted blobs");

  Ok(())
}

#[rstest]
fn healthcheck_with_refs_and_index(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "initial")?;
  repo.add(file_name)?;
  repo.commit_debug()?;

  repo.new_branch("test_branch")?;
  repo.checkout("test_branch", true)?;

  fs::write(_sandbox.path().join(file_name), "modified but not committed")?;
  repo.add(file_name)?;

  fs::write(_sandbox.path().join(file_name), "committed in branch")?;
  repo.add(file_name)?;
  repo.commit_debug()?;

  let bad_objects = repo.healthcheck()?;
  assert_eq!(bad_objects.len(), 0, "healthy repository with branches should not have problems");

  repo.checkout("master", true)?;

  let bad_objects = repo.healthcheck()?;
  assert_eq!(bad_objects.len(), 0, "healthy repository after switching branches should not have problems");

  Ok(())
}

#[rstest]
fn healthcheck_error_context(_sandbox: TempDir, #[with(&_sandbox)] mut repo: Repo<TestCreds>) -> Result {
  let file_name = "test_file.txt";

  fs::write(_sandbox.path().join(file_name), "content for context test")?;
  repo.add(file_name)?;
  let (commit_oid, _) = repo.commit_debug()?;

  let commit = repo.repo().find_commit(commit_oid)?;
  let tree = commit.tree()?;
  let blob_entry = tree.get_name(file_name).unwrap();
  let blob_id = blob_entry.id();

  drop(blob_entry);
  drop(tree);
  drop(commit);

  repo.debug_remove_object(&[blob_id])?;
  let bad_objects = repo.healthcheck()?;

  assert!(!bad_objects.is_empty());
  let bad_object = &bad_objects[0];

  match bad_object.ctx.stage {
    WalkStage::Revwalk | WalkStage::AnyRef | WalkStage::Index => {}
    WalkStage::Ref(_) => {}
  }

  assert!(!bad_object.raw_err.is_empty(), "Should have error information");

  Ok(())
}
