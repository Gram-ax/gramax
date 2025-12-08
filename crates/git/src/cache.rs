use std::cell::Cell;
use std::cell::RefCell;
use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::atomic::AtomicU64;
use std::sync::atomic::Ordering;
use std::sync::Mutex;

use serde::Serialize;

use crate::creds::Creds;
use crate::creds::DummyCreds;
use crate::error::Error;
use crate::ext::walk::Walk;
use crate::file_lock::*;
use crate::prelude::Gc;
use crate::prelude::HealthcheckError;
use crate::refmut::RefOrMut;
use crate::repo::Repo;

use crate::commands::Result;

struct SafeRepository(git2::Repository);

unsafe impl Send for SafeRepository {}
unsafe impl Sync for SafeRepository {}

static GLOBAL_CACHE: Mutex<Option<HashMap<PathBuf, SafeRepository>>> = Mutex::new(None);

static CACHE_GENERATION: AtomicU64 = AtomicU64::new(0);

thread_local! {
  static LOCAL_CACHE: RefCell<HashMap<PathBuf, git2::Repository>> = RefCell::new(HashMap::new());
  static LOCAL_GENERATION: Cell<u64> = const { Cell::new(0) };
}

fn check_and_clear_local_cache() {
  let global_gen = CACHE_GENERATION.load(Ordering::Acquire);
  LOCAL_GENERATION.with(|local_gen| {
    if local_gen.get() != global_gen {
      LOCAL_CACHE.with_borrow_mut(|cache| cache.clear());
      local_gen.set(global_gen);
    }
  });
}

fn with_local_repo<P, F, R>(repo_path: P, f: F) -> Result<R>
where
  P: AsRef<Path>,
  R: Serialize,
  F: FnOnce(&mut git2::Repository) -> Result<R>,
{
  check_and_clear_local_cache();

  let canonical_path = repo_path.as_ref().canonicalize().unwrap_or_else(|_| repo_path.as_ref().to_path_buf());

  LOCAL_CACHE.with_borrow_mut(|cache| {
    if !cache.contains_key(&canonical_path) {
      let repo = Repo::open(repo_path.as_ref(), DummyCreds)?;
      cache.insert(canonical_path.clone(), repo.0.take().unwrap());
    }

    let repo = cache.get_mut(&canonical_path).unwrap();
    f(repo)
  })
}

fn with_global_repo<P, F, R>(repo_path: P, f: F) -> Result<R>
where
  P: AsRef<Path>,
  R: Serialize,
  F: FnOnce(&mut git2::Repository) -> Result<R>,
{
  let canonical_path = repo_path.as_ref().canonicalize().unwrap_or_else(|_| repo_path.as_ref().to_path_buf());

  let mut cache = GLOBAL_CACHE.lock().unwrap();
  let map = cache.get_or_insert_with(HashMap::new);

  if !map.contains_key(&canonical_path) {
    let repo = Repo::open(repo_path.as_ref(), DummyCreds)?;
    map.insert(canonical_path.clone(), SafeRepository(repo.0.take().unwrap()));
  }

  let repo = map.get_mut(&canonical_path).unwrap();
  f(&mut repo.0)
}

impl<'r, C: Creds + Clone> Repo<'r, C> {
  pub fn run_read<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let lock_path = repo_path.as_ref().join(".git").join(FILE_LOCK_PATH);

    if FileLock::get_locked_ctx(&lock_path)?.is_some() {
      healthcheck_if_locked(&repo_path, &lock_path, &creds)?;
    }

    with_local_repo(&repo_path, |repo| f(Repo(RefOrMut::Mut(repo), creds)))
  }

  pub fn run_write<P, F, R>(repo_path: P, creds: C, context: &str, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let result = with_global_repo(&repo_path, |repo| {
      let lock_path = repo.path().join(FILE_LOCK_PATH);
      if let Some(data) = FileLock::get_locked_ctx(&lock_path)? {
        warn!(%data, "lock file is locked; healthchecking");

        let repo_wrapper = Repo(RefOrMut::Mut(repo), creds.clone());
        let bad_objects = repo_wrapper.healthcheck()?;

        if bad_objects.is_empty() {
          info!("healthcheck passed; unlocking stuck lock file");
          FileLock::unlock(&lock_path)?;
        } else {
          let prev_log = repo_wrapper.last_gc()?;
          let err = HealthcheckError {
            bad_objects: Some(bad_objects),
            inner: Some(git2::Error::from_str(&data)),
            prev_log,
          };
          return Err(Error::FileLockHealthcheckFailed(err).into());
        }
      }

      let file_lock = create_file_lock(repo, lock_path, context)?;
      let result = f(Repo(RefOrMut::Mut(repo), creds));
      drop(file_lock);
      result
    });

    if result.is_ok() {
      invalidate_local_caches();
    }

    result
  }
}

fn healthcheck_if_locked<P, C>(repo_path: P, lock_path: &Path, creds: &C) -> Result<()>
where
  P: AsRef<Path>,
  C: Creds + Clone,
{
  with_global_repo(&repo_path, |repo| {
    let Some(data) = FileLock::get_locked_ctx(lock_path)? else {
      return Ok(());
    };

    warn!(%data, "lock file is locked; healthchecking");

    let repo_wrapper = Repo(RefOrMut::Mut(repo), creds.clone());
    let bad_objects = repo_wrapper.healthcheck()?;

    if bad_objects.is_empty() {
      info!("healthcheck passed; unlocking stuck lock file");
      FileLock::unlock(lock_path)?;
      return Ok(());
    }

    let prev_log = repo_wrapper.last_gc()?;
    let err = HealthcheckError {
      bad_objects: Some(bad_objects),
      inner: Some(git2::Error::from_str(&data)),
      prev_log,
    };
    Err(Error::FileLockHealthcheckFailed(err).into())
  })
}

fn create_file_lock(_repo: &git2::Repository, lock_path: PathBuf, cmd: &str) -> Result<FileLock> {
  match FileLock::lock_with_ctx(lock_path.clone(), FileLockData { cmd, ctx: &() }) {
    Ok(lock) => Ok(lock),
    Err(FileLockError::WouldBlock(data)) => {
      warn!(%data, "lock file would block; forcing unlock");
      FileLock::unlock(&lock_path)?;
      Ok(FileLock::lock_with_ctx(lock_path, FileLockData { cmd, ctx: &() })?)
    }
    Err(e) => Err(e.into()),
  }
}

fn invalidate_local_caches() {
  CACHE_GENERATION.fetch_add(1, Ordering::Release);
}

pub fn reset_file_lock(repo_path: &Path) {
  let lock_path = repo_path.join(".git").join(FILE_LOCK_PATH);
  info!(path = %lock_path.display(), "unlocking lock file");
  if let Err(e) = FileLock::unlock(&lock_path) {
    warn!(err = %e, path = %lock_path.display(), "failed to unlock lock file");
  }
}

pub fn reset_repo() {
  invalidate_local_caches();

  let mut cache = GLOBAL_CACHE.lock().unwrap();
  *cache = None;

  LOCAL_CACHE.with_borrow_mut(|cache| cache.clear());
  LOCAL_GENERATION.with(|gen| gen.set(CACHE_GENERATION.load(Ordering::Acquire)));
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::thread;
  use std::time::Duration;

  #[test]
  fn test_read_uses_local_cache() {
    let tmp = tempdir::TempDir::new("test_repo").unwrap();
    git2::Repository::init(tmp.path()).unwrap();

    let path = tmp.path().to_path_buf();

    let _ = Repo::run_read(&path, DummyCreds, |_| Ok(()));

    LOCAL_CACHE.with_borrow(|cache| {
      let canonical = path.canonicalize().unwrap();
      assert!(cache.contains_key(&canonical), "Read should cache locally");
    });
  }

  #[test]
  fn test_write_uses_global_cache() {
    let tmp = tempdir::TempDir::new("test_repo").unwrap();
    git2::Repository::init(tmp.path()).unwrap();

    let path = tmp.path().to_path_buf();
    let canonical = path.canonicalize().unwrap();

    let _ = Repo::run_write(&path, DummyCreds, "test", |_| Ok(()));

    let cache = GLOBAL_CACHE.lock().unwrap();
    assert!(
      cache.as_ref().map(|m| m.contains_key(&canonical)).unwrap_or(false),
      "Write should cache globally"
    );
  }

  #[test]
  fn test_reset_clears_all_caches() {
    let tmp = tempdir::TempDir::new("test_repo").unwrap();
    git2::Repository::init(tmp.path()).unwrap();

    let path = tmp.path().to_path_buf();
    let canonical = path.canonicalize().unwrap();

    let _ = Repo::run_read(&path, DummyCreds, |_| Ok(()));
    let _ = Repo::run_write(&path, DummyCreds, "test", |_| Ok(()));

    reset_repo();

    LOCAL_CACHE.with_borrow(|cache| {
      assert!(!cache.contains_key(&canonical), "Local cache should be cleared");
    });

    let cache = GLOBAL_CACHE.lock().unwrap();
    assert!(cache.is_none(), "Global cache should be cleared");
  }

  #[test]
  fn test_generation_invalidates_other_threads() {
    let tmp = tempdir::TempDir::new("test_repo").unwrap();
    git2::Repository::init(tmp.path()).unwrap();

    let path = tmp.path().to_path_buf();

    let path_clone = path.clone();
    let handle = thread::spawn(move || {
      let _ = Repo::run_read(&path_clone, DummyCreds, |_| Ok(()));

      thread::sleep(Duration::from_millis(100));

      check_and_clear_local_cache();

      LOCAL_CACHE.with_borrow(|cache| {
        let canonical = path_clone.canonicalize().unwrap();
        assert!(!cache.contains_key(&canonical), "Local cache should be invalidated by reset");
      });
    });

    thread::sleep(Duration::from_millis(50));
    reset_repo();

    handle.join().unwrap();
  }

  #[test]
  fn test_concurrent_read_lock_free() {
    let tmp = tempdir::TempDir::new("test_repo").unwrap();
    git2::Repository::init(tmp.path()).unwrap();

    let path = tmp.path().to_path_buf();

    let handles: Vec<_> = (0..10)
      .map(|_| {
        let p = path.clone();
        thread::spawn(move || {
          for _ in 0..100 {
            let result = Repo::run_read(&p, DummyCreds, |_| Ok(42));
            assert_eq!(result.unwrap(), 42);
          }
        })
      })
      .collect();

    for h in handles {
      h.join().unwrap();
    }
  }
}
