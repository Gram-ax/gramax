use git2::ObjectType;
use std::fs;
use std::path::Path;
use test_utils::git::*;
use test_utils::*;

#[rstest]
fn gc_naive(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let loose_objects = repo.collect_loose_objects()?;

  // this is ok cuz repo creates init commit
  // one of two objects is supposed to be the init commit and other is the commit's tree
  assert_eq!(loose_objects.len(), 2);

  let mut loose_objects = loose_objects.into_iter();
  let mut init_commit_oid = loose_objects.next().unwrap();
  let mut init_tree_oid = loose_objects.next().unwrap();

  if repo.repo().find_tree(init_tree_oid).is_err() {
    (init_tree_oid, init_commit_oid) = (init_commit_oid, init_tree_oid);
  }

  assert_eq!(repo.repo().find_object(init_commit_oid, None)?.kind().unwrap(), ObjectType::Commit);
  assert_eq!(repo.repo().find_object(init_tree_oid, None)?.kind().unwrap(), ObjectType::Tree);

  assert!(!is_any_object_dir_empty(repo.repo()), "objects dir should not be empty");
  let gc_options = GcOptions { loose_objects_limit: Some(1), ..Default::default() };
  assert!(!is_any_object_dir_empty(repo.repo()), "objects dir should not be empty");

  assert!(repo.gc(gc_options).is_ok());

  assert_eq!(repo.repo().find_object(init_commit_oid, None)?.kind().unwrap(), ObjectType::Commit);
  assert_eq!(repo.repo().find_object(init_tree_oid, None)?.kind().unwrap(), ObjectType::Tree);

  let loose_objects = repo.collect_loose_objects()?;
  assert_eq!(loose_objects.len(), 0);

  Ok(())
}

#[rstest]
fn gc_with_reflog_objects(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let file_name = "file";
  let master_branch_name = "master";
  let second_branch_name = "dev";

  fs::write(_sandbox.path().join(file_name), "initial")?;
  repo.add(file_name)?;
  let (commit1_oid, _) = repo.commit_debug()?;

  repo.new_branch(second_branch_name)?;
  repo.checkout(second_branch_name, true)?;

  fs::write(_sandbox.path().join(file_name), "modified")?;
  repo.add(file_name)?;
  let (commit2_oid, _) = repo.commit_debug()?;

  repo.checkout(master_branch_name, true)?;

  // delete branch to leave its objects accessible only via reflog
  repo.delete_branch_local(second_branch_name)?;

  let gc_options = GcOptions { loose_objects_limit: Some(1), ..Default::default() };
  repo.gc(gc_options)?;

  assert!(repo.repo().find_commit(commit1_oid).is_ok());
  assert!(repo.repo().find_commit(commit2_oid).is_ok());

  let commit1 = repo.repo().find_commit(commit1_oid)?;
  let commit2 = repo.repo().find_commit(commit2_oid)?;
  assert!(repo.repo().find_tree(commit1.tree_id()).is_ok());
  assert!(repo.repo().find_tree(commit2.tree_id()).is_ok());

  let tree1 = commit1.tree()?;
  let tree2 = commit2.tree()?;
  let blob1_entry = tree1.get_name(file_name).unwrap();
  let blob2_entry = tree2.get_name(file_name).unwrap();
  assert!(repo.repo().find_blob(blob1_entry.id()).is_ok());
  assert!(repo.repo().find_blob(blob2_entry.id()).is_ok());

  // walk through whole reflog to ensure that all objects are accessible
  let reflog = repo.repo().reflog("HEAD")?;
  for entry in reflog.iter() {
    let old_id = entry.id_old();
    let new_id = entry.id_new();

    assert!(repo.repo().find_object(new_id, None).is_ok());
    if !old_id.is_zero() {
      assert!(repo.repo().find_object(old_id, None).is_ok());
    }
  }

  let loose_objects_after = repo.collect_loose_objects()?;
  assert_eq!(loose_objects_after.len(), 0);

  Ok(())
}

#[rstest]
fn gc_with_index_objects(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let file_name = "file-1";
  let file2_name = "file-2";

  // create a commit with file1 only
  fs::write(_sandbox.path().join(file_name), "first file")?;
  repo.add(file_name)?;
  let (commit_oid, _) = repo.commit_debug()?;

  fs::write(_sandbox.path().join(file2_name), "second file")?;
  repo.add(file2_name)?;

  // check the file2 to be existing in current index
  let index = repo.repo().index()?;
  let file2_entry = index.get_path(Path::new(file2_name), 0).unwrap();
  let file2_blob_id = file2_entry.id;
  assert!(repo.repo().find_blob(file2_blob_id).is_ok());

  // write & add to index file2 5 times with different content; should be removed after gc
  let mut to_be_removed = vec![];
  for i in 1..5 {
    let content = format!("content_{}", i);
    fs::write(_sandbox.path().join(file2_name), content)?;
    repo.add(file2_name)?;
    let index = repo.repo().index()?;

    let entry = index.get_path(Path::new(file2_name), 0).unwrap();
    to_be_removed.push(entry.id);

    let entry = index.get_path(Path::new(file2_name), 0).unwrap();
    assert!(repo.repo().find_blob(entry.id).is_ok());
  }

  let loose_objects_before = repo.collect_loose_objects()?;
  assert!(!loose_objects_before.is_empty());

  // write final content to file2; should be still existing after gc
  fs::write(_sandbox.path().join(file2_name), "final")?;
  repo.add(file2_name)?;

  let gc_options = GcOptions { loose_objects_limit: Some(1), ..Default::default() };
  repo.gc(gc_options)?;

  // ensure that all objects that should be removed are actually removed
  for oid in to_be_removed {
    assert!(repo.repo().find_object(oid, None).is_err());
  }

  // ensure that commit and its tree are still existing after gc
  assert!(repo.repo().find_commit(commit_oid).is_ok());
  let commit = repo.repo().find_commit(commit_oid)?;
  assert!(repo.repo().find_tree(commit.tree_id()).is_ok());

  // file1 should be still existing after gc
  let tree = commit.tree()?;
  let blob1_entry = tree.get_name(file_name).unwrap();
  assert!(repo.repo().find_blob(blob1_entry.id()).is_ok());

  let loose_objects_after = repo.collect_loose_objects()?;
  assert_eq!(loose_objects_after.len(), 0);

  Ok(())
}

#[rstest]
fn gc_with_large_data(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  // create many files with unique content to generate multiple loose objects
  for i in 0..5100 {
    let filename = format!("file{}.txt", i);
    fs::write(_sandbox.path().join(&filename), format!("content of file {} - {}", i, "X".repeat(i % 10)))?;

    if i % 50 == 49 {
      repo.add(&filename)?;
      fs::write(
        _sandbox.path().join(&filename),
        format!("2nd generation of file content {} - {}", i, "X".repeat(i % 10)),
      )?;
      repo.add(&filename)?;
    }

    // add files to index in small groups
    if i % 300 == 299 {
      repo.add_glob(vec!["*.txt"])?;
      repo.commit_debug()?;
    }
  }

  // add remaining files and make final commit
  repo.add_glob(vec!["*.txt"])?;
  repo.commit_debug()?;

  // check number of loose objects
  let loose_objects_before = repo.collect_loose_objects()?;
  assert!(loose_objects_before.len() > 5000, "loose objects should be >5000");

  let unreachable_objects = repo.collect_unreachable_objects(&loose_objects_before)?;
  assert!(unreachable_objects.len() > 100, "unreachable objects should be >100");

  // run gc with small limit to trigger packing
  let gc_options = GcOptions { loose_objects_limit: Some(100), ..Default::default() };
  assert!(repo.gc(gc_options).is_ok());

  // check that number of loose objects decreased
  let loose_objects_after = repo.collect_loose_objects()?;
  assert!(loose_objects_after.is_empty(), "all loose objects should be packed");

  // check that all files are still accessible after gc
  let head_commit = repo.repo().head()?.peel_to_commit()?;
  let tree = head_commit.tree()?;

  for i in [0, 100, 1000, 2500, 4000, 5000] {
    let filename = format!("file{}.txt", i);
    assert!(tree.get_path(Path::new(&filename)).is_ok(), "file {} should exist after gc", filename);
  }

  Ok(())
}

#[rstest]
fn gc_multiple_calls(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let file_name = "file";

  // initial commit
  fs::write(_sandbox.path().join(file_name), "initial")?;
  repo.add(file_name)?;
  repo.commit_debug()?;

  let top_i = 10;
  let top_j = 3;
  let top_k = 10;

  for i in 0..top_i {
    for j in 0..top_j {
      for k in 0..top_k {
        fs::write(_sandbox.path().join(file_name), format!("content_{}_{}_{}", i, j, k))?;
        repo.add(file_name)?;
      }
      fs::write(_sandbox.path().join(file_name), format!("content_{}_{}_final", i, j))?;
      repo.add(file_name)?;
      repo.commit_debug()?;
    }

    let loose_objects = repo.collect_loose_objects()?;
    assert!(
      loose_objects.len() > top_j * top_k,
      "loose objects should be >(j * k) = {}; actual = {}",
      top_j * top_k,
      loose_objects.len()
    );

    let pack_files = count_pack_files(repo.repo()) as isize;
    assert!(pack_files == i, "pack files count should be =i = {}; actual = {}", i, pack_files);
    assert!(!is_any_object_dir_empty(repo.repo()), "all objects dirs should not be empty");

    let gc_options = GcOptions { loose_objects_limit: Some(1), ..Default::default() };
    repo.gc(gc_options)?;

    assert!(!is_any_object_dir_empty(repo.repo()), "all objects dirs should not be empty");

    let loose_objects = repo.collect_loose_objects()?;
    let loose_objects_count = loose_objects.len();
    assert!(loose_objects_count == 0, "loose objects should be 0; actual = {}", loose_objects_count);

    let pack_files = count_pack_files(repo.repo()) as isize;
    assert!(pack_files == i + 1, "pack files should be =i+1 = {}; actual = {}", i + 1, pack_files);
  }

  let pack_files = count_pack_files(repo.repo()) as isize;

  // verify that pack files were created and their count is reasonable
  assert!(pack_files > 0, "pack files should be created");
  assert!(pack_files <= top_i, "should not create more pack files than GC operations");

  Ok(())
}

#[rstest]
fn gc_loose_objects_limit_not_reached(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let file_name = "file";

  fs::write(_sandbox.path().join(file_name), "content")?;
  repo.add(file_name)?;
  repo.commit_debug()?;

  let initial_loose_count = repo.collect_loose_objects()?.len();
  let initial_pack_files = count_pack_files(repo.repo());

  let gc_opts = GcOptions { loose_objects_limit: Some(initial_loose_count + 1), ..Default::default() };

  repo.gc(gc_opts)?;

  assert_eq!(
    repo.collect_loose_objects()?.len(),
    initial_loose_count,
    "loose objects count should not change when limit not reached (initial = {}, actual = {})",
    initial_loose_count,
    repo.collect_loose_objects()?.len()
  );

  let final_pack_files = count_pack_files(repo.repo());

  assert_eq!(
    final_pack_files, initial_pack_files,
    "pack files count should not change when limit not reached (initial = {}, actual = {})",
    initial_pack_files, final_pack_files
  );

  Ok(())
}

fn count_pack_files(repo: &git2::Repository) -> usize {
  std::fs::read_dir(repo.path().join("objects/pack"))
    .unwrap()
    .filter_map(|entry| entry.ok())
    .filter(|entry| entry.file_name().to_string_lossy().ends_with(".pack"))
    .count()
}

fn is_any_object_dir_empty(repo: &git2::Repository) -> bool {
  let objects_dir = repo.path().join("objects");
  for entry in std::fs::read_dir(&objects_dir).unwrap() {
    let entry = entry.unwrap();
    if entry.file_type().unwrap().is_dir() {
      let dir_path = entry.path();
      let dir_name = entry.file_name();
      // skip 'pack' and 'info' directories as they are special
      if dir_name != "pack" && dir_name != "info" {
        let has_files = std::fs::read_dir(&dir_path).unwrap().next().is_some();
        if !has_files {
          return true;
        }
      }
    }
  }

  false
}
