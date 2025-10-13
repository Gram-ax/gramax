use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::RwLock;

use std::sync::RwLockReadGuard;
use std::sync::RwLockWriteGuard;

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

const RW_READ_TAG: &str = "rw_read";
const RW_WRITE_TAG: &str = "rw_write";

static LATEST_REPO_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);
static LATEST_REPO: RwLock<Option<RawRepository>> = RwLock::new(None);

pub struct RawRepository(git2::Repository);

unsafe impl Send for RawRepository {}
unsafe impl Sync for RawRepository {}

impl<'r, C: Creds + Clone> Repo<'r, C> {
  pub fn run_rw_read<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let guard = rw_read::<'_>(&repo_path)?;

    let res = match FileLock::get_locked_ctx(&repo_path.as_ref().join(".git").join(FILE_LOCK_PATH))? {
      Some(data) => {
        drop(guard);
        warn!(target: RW_READ_TAG, %data, "lock file is locked; healthchecking");
        Repo::run_rw_write_no_lock(&repo_path, creds.clone(), |repo| {
          let bad_objects = repo.healthcheck()?;
          if bad_objects.is_empty() {
            return Ok(());
          }

          let prev_log = repo.last_gc()?;
          let err = HealthcheckError {
            bad_objects: Some(bad_objects),
            inner: Some(git2::Error::from_str(&data)),
            prev_log,
          };
          Err(Error::FileLockHealthcheckFailed(err).into())
        })?;

        info!(target: RW_READ_TAG, "healthcheck passed; unlocking stuck lock file");
        FileLock::unlock(&repo_path.as_ref().join(".git").join(FILE_LOCK_PATH))?;
        Repo::run_rw_read(repo_path, creds, f)
      }
      None => {
        let res = f(Repo(RefOrMut::Ref(&guard.as_ref().unwrap().0), creds));
        drop(guard);
        res
      }
    };

    res
  }

  pub fn run_rw_write<P, F, R>(repo_path: P, creds: C, context: &str, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let mut guard = rw_write::<'_>(&repo_path)?;
    let repo = RefOrMut::Mut(&mut guard.as_mut().unwrap().0);
    let repo = Repo(repo, creds);
    let file_lock = repo_create_file_lock(&repo, context)?;
    let res = f(repo);
    drop(file_lock);
    res
  }

  pub fn run_rw_read_no_lock<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let guard = rw_read::<'_>(&repo_path)?;
    let repo = RefOrMut::Ref(&guard.as_ref().unwrap().0);
    f(Repo(repo, creds))
  }

  pub fn run_rw_write_no_lock<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let mut guard = rw_write::<'_>(&repo_path)?;
    let repo = RefOrMut::Mut(&mut guard.as_mut().unwrap().0);
    f(Repo(repo, creds))
  }
}

fn repo_create_file_lock<C: Creds>(repo: &Repo<'_, C>, cmd: &str) -> Result<FileLock> {
  let lock_path = repo.repo().path().join(FILE_LOCK_PATH);
  let lock = match FileLock::lock_with_ctx(lock_path, FileLockData { cmd, ctx: &() }) {
    Ok(lock) => lock,
    Err(FileLockError::WouldBlock(data)) => {
      warn!(target: RW_WRITE_TAG, %data, "lock file would block; healthchecking");
      let bad_objects = repo.healthcheck()?;

      if !bad_objects.is_empty() {
        let prev_log = repo.last_gc()?;
        let err = HealthcheckError {
          bad_objects: Some(bad_objects),
          inner: Some(git2::Error::from_str(&data)),
          prev_log,
        };
        return Err(Error::FileLockHealthcheckFailed(err).into());
      }

      let lock_path = repo.repo().path().join(FILE_LOCK_PATH);
      FileLock::unlock(&lock_path)?;
      FileLock::lock_with_ctx(lock_path, FileLockData { cmd, ctx: &() })?
    }
    Err(e) => return Err(e.into()),
  };
  Ok(lock)
}

fn rw_write<'g, P: AsRef<Path>>(repo_path: P) -> Result<RwLockWriteGuard<'g, Option<RawRepository>>> {
  let mut latest_path = LATEST_REPO_PATH.lock().unwrap();
  let mut latest_repo = LATEST_REPO.write().unwrap();

  if latest_path.as_ref().is_none_or(|r| r != repo_path.as_ref()) || latest_repo.is_none() {
    latest_path.replace(repo_path.as_ref().to_path_buf());
    let repo = Repo::open(repo_path.as_ref(), DummyCreds)?;
    latest_repo.replace(RawRepository(repo.0.take().unwrap()));
  }

  drop(latest_path);
  Ok(latest_repo)
}

fn rw_read<'g, P: AsRef<Path>>(repo_path: P) -> Result<RwLockReadGuard<'g, Option<RawRepository>>> {
  let mut latest_path = LATEST_REPO_PATH.lock().unwrap();

  if latest_path.as_ref().is_none_or(|r| r != repo_path.as_ref()) || LATEST_REPO.read().unwrap().is_none() {
    let repo = Repo::open(repo_path.as_ref(), DummyCreds)?;
    latest_path.replace(repo_path.as_ref().to_path_buf());
    LATEST_REPO.write().unwrap().replace(RawRepository(repo.0.take().unwrap()));
  }

  drop(latest_path);
  Ok(LATEST_REPO.read().unwrap())
}

pub fn reset_file_lock(repo_path: &Path) {
  let lock_path = repo_path.join(".git").join(FILE_LOCK_PATH);
  info!(path = %lock_path.display(), "unlocking lock file");
  if let Err(e) = FileLock::unlock(&lock_path) {
    warn!(err = %e, path = %lock_path.display(), "failed to unlock lock file");
  }
}

pub fn reset_repo() {
  LATEST_REPO_PATH.lock().unwrap().take();
  LATEST_REPO.write().unwrap().take();
}
