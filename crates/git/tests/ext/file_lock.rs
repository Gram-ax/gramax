use std::sync::Barrier;
use std::thread::sleep;
use std::time::Duration;

use gramaxgit::ext::walk::Walk;
use test_utils::git::*;
use test_utils::*;

#[rstest]
fn lock_file_create(sandbox: TempDir) -> Result {
  let path = sandbox.path().join(".lock");
  let lock = FileLock::lock(path.clone())?;

  assert!(path.exists());
  drop(lock);
  assert!(!path.exists());

  Ok(())
}

#[rstest]
fn lock_file_would_block(sandbox: TempDir) -> Result {
  let path = sandbox.path().join(".lock");
  let lock = FileLock::lock(path.clone())?;

  assert!(FileLock::lock(path.clone()).is_err());
  assert!(path.exists());

  drop(lock);
  assert!(!path.exists());
  let lock = FileLock::lock(path.clone())?;
  assert!(path.exists());

  drop(lock);
  assert!(!path.exists());

  Ok(())
}

#[rstest]
fn lock_file_wait_times_out(sandbox: TempDir) -> Result {
  let path = sandbox.path().join(".lock");
  let _holder = FileLock::lock(path.clone())?;

  let err = FileLock::wait(&path, Duration::from_millis(50)).unwrap_err();
  assert!(matches!(err, FileLockError::TimedOut(_)));

  Ok(())
}

#[rstest]
fn lock_file_ctx(sandbox: TempDir) -> Result {
  let path = sandbox.path().join(".lock");
  let _lock = FileLock::lock_with_ctx(path.clone(), FileLockData { cmd: "test", ctx: &"test" })?;

  let content = FileLock::get_locked_ctx(&path)?.expect("ctx should exist");

  let got: serde_json::Value = serde_json::from_str(&content).unwrap();
  let expected = serde_json::json!({"cmd": "test", "ctx": "test"});
  assert_eq!(got, expected);

  Ok(())
}

#[rstest]
fn lock_file_is_locked(sandbox: TempDir) -> Result {
  let path = sandbox.path().join(".lock");
  assert!(!FileLock::is_locked(&path));

  let _lock = FileLock::lock(path.clone())?;
  assert!(FileLock::is_locked(&path));

  Ok(())
}

#[rstest]
fn lock_file_wait(sandbox: TempDir) -> Result {
  let path = sandbox.path().join(".lock");
  let path2 = path.clone();

  let start_barrier = std::sync::Arc::new(Barrier::new(2));
  let lock_acquired_barrier = std::sync::Arc::new(Barrier::new(2));

  let start_barrier1 = start_barrier.clone();
  let start_barrier2 = start_barrier.clone();

  let lock_acquired_barrier1 = lock_acquired_barrier.clone();
  let lock_acquired_barrier2 = lock_acquired_barrier.clone();

  let lock_holder = std::thread::spawn(move || {
    start_barrier1.wait();
    let lock = FileLock::lock(path2.clone()).unwrap();
    lock_acquired_barrier1.wait();
    sleep(Duration::from_millis(500));
    drop(lock);
  });

  start_barrier2.wait();
  lock_acquired_barrier2.wait();

  let lock_err = FileLock::lock(path.clone()).unwrap_err();
  assert!(matches!(lock_err, FileLockError::WouldBlock(_)));

  FileLock::wait(&path, Duration::from_millis(1000))?;
  assert!(!FileLock::is_locked(&path));

  lock_holder.join().unwrap();

  Ok(())
}

#[rstest]
fn lock_file_run_read_command(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  let lock_path = repo.repo().path().join(FILE_LOCK_PATH);
  let global_lock = FileLock::lock(lock_path.clone())?;

  let ran = std::sync::atomic::AtomicBool::new(false);

  Repo::run_rw_read(sandbox.path(), TestCreds, |_| {
    ran.store(true, std::sync::atomic::Ordering::Relaxed);
    Ok(())
  })
  .unwrap();

  assert!(ran.load(std::sync::atomic::Ordering::Relaxed));
  assert!(!FileLock::is_locked(&lock_path));

  drop(global_lock); // will say that lock file doesn't exist; that's ok
  Ok(())
}

#[rstest]
fn lock_file_run_write_command(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  let lock_path = repo.repo().path().join(FILE_LOCK_PATH);
  let global_lock = FileLock::lock(lock_path.clone())?;

  let ran = std::sync::atomic::AtomicBool::new(false);

  Repo::run_rw_write(sandbox.path(), TestCreds, "test", |_| {
    ran.store(true, std::sync::atomic::Ordering::Relaxed);
    Ok(())
  })
  .unwrap();

  assert!(ran.load(std::sync::atomic::Ordering::Relaxed));
  assert!(!FileLock::is_locked(&lock_path));

  drop(global_lock); // will say that lock file doesn't exist; that's ok
  Ok(())
}

#[rstest]
fn lock_file_run_read_command_healthcheck_fails(
  sandbox: TempDir,
  #[with(&sandbox)] mut repo: Repo<TestCreds>,
) -> Result {
  let file_name = "test_file";
  std::fs::write(sandbox.path().join(file_name), "content")?;
  repo.add(file_name)?;
  let commit = repo.commit_debug()?;

  let tree = repo.repo().find_commit(commit.0)?.tree()?;
  let blob_id = tree.get_name(file_name).unwrap().id();
  drop(tree);

  repo.debug_remove_object(&[blob_id])?;
  let bad_objects = repo.healthcheck()?;
  assert!(!bad_objects.is_empty(), "should have bad objects");

  // at this point repository is 'broken': it contains bad objects & active lock file
  let lock_path = repo.repo().path().join(FILE_LOCK_PATH);
  let global_lock = FileLock::lock(lock_path.clone())?;

  let mut threads = vec![];

  for _ in 0..15 {
    let path = sandbox.path().to_path_buf();
    let thread = std::thread::spawn(move || {
      let ran = std::sync::atomic::AtomicBool::new(false);

      let result = Repo::run_rw_read(path.clone(), TestCreds, |_| {
        ran.store(true, std::sync::atomic::Ordering::Relaxed);
        Ok(())
      });

      assert!(result.is_err(), "should fail due to failed healthcheck");
      assert!(!ran.load(std::sync::atomic::Ordering::Relaxed), "callback should not be executed");
      assert!(FileLock::is_locked(&path), "lock file should remain locked");
    });
    threads.push(thread);
  }

  for thread in threads {
    thread.join().unwrap();
  }

  drop(global_lock);
  Ok(())
}

#[rstest]
fn lock_file_run_write_command_healthcheck_fails(
  sandbox: TempDir,
  #[with(&sandbox)] repo: Repo<TestCreds>,
) -> Result {
  let file_name = "test_file";
  std::fs::write(sandbox.path().join(file_name), "content")?;
  repo.add(file_name)?;
  let commit = repo.commit_debug()?;

  let tree = repo.repo().find_commit(commit.0)?.tree()?;
  let blob_id = tree.get_name(file_name).unwrap().id();

  let id_str = blob_id.to_string();
  let mid = id_str.char_indices().nth(2).map(|(i, _)| i).unwrap_or(id_str.len());
  let (prefix, rest) = id_str.split_at(mid);
  let obj_path = repo.repo().path().join("objects").join(prefix).join(rest);
  std::fs::remove_file(obj_path)?;

  let bad_objects = repo.healthcheck()?;
  assert!(!bad_objects.is_empty(), "should have bad objects");

  // at this point repository is 'broken': it contains bad objects & active lock file
  let lock_path = repo.repo().path().join(FILE_LOCK_PATH);
  let global_lock = FileLock::lock(lock_path.clone())?;

  let mut threads = vec![];

  for _ in 0..5 {
    let path = sandbox.path().to_path_buf();
    let thread = std::thread::spawn(move || {
      let ran = std::sync::atomic::AtomicBool::new(false);

      let result = Repo::run_rw_write(path.clone(), TestCreds, "test", |_| {
        ran.store(true, std::sync::atomic::Ordering::Relaxed);
        Ok(())
      });

      assert!(result.is_err(), "should fail due to failed healthcheck");
      assert!(!ran.load(std::sync::atomic::Ordering::Relaxed), "callback should not be executed");
      assert!(FileLock::is_locked(&path), "lock file should remain locked");
    });

    threads.push(thread);
  }

  for thread in threads {
    thread.join().unwrap();
  }

  drop(global_lock);
  Ok(())
}
