use std::path::Path;
use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::RwLock;

use std::sync::RwLockReadGuard;
use std::sync::RwLockWriteGuard;

use serde::Serialize;

use crate::creds::Creds;
use crate::creds::DummyCreds;
use crate::refmut::RefOrMut;
use crate::repo::Repo;

use crate::commands::Result;

static LATEST_REPO_PATH: Mutex<Option<PathBuf>> = Mutex::new(None);
static LATEST_REPO: RwLock<Option<RawRepository>> = RwLock::new(None);

pub struct RawRepository(git2::Repository);

unsafe impl Send for RawRepository {}
unsafe impl Sync for RawRepository {}

impl<'r, C: Creds> Repo<'r, C> {
  pub fn run_rw_read<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let guard = rw_read::<'_>(repo_path)?;
    let repo = RefOrMut::Ref(&guard.as_ref().unwrap().0);
    f(Repo(repo, creds))
  }

  pub fn run_rw_write<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    let mut guard = rw_write::<'_>(repo_path)?;
    let repo = RefOrMut::Mut(&mut guard.as_mut().unwrap().0);
    f(Repo(repo, creds))
  }

  pub fn run_rw_unlocked<P, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    P: AsRef<Path>,
    R: Serialize,
    F: FnOnce(Repo<'_, C>) -> Result<R>,
  {
    f(Repo::open(repo_path, creds)?)
  }
}

pub fn rw_write<'g, P: AsRef<Path>>(repo_path: P) -> Result<RwLockWriteGuard<'g, Option<RawRepository>>> {
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

pub fn rw_read<'g, P: AsRef<Path>>(repo_path: P) -> Result<RwLockReadGuard<'g, Option<RawRepository>>> {
  let mut latest_path = LATEST_REPO_PATH.lock().unwrap();

  if latest_path.as_ref().is_none_or(|r| r != repo_path.as_ref()) || LATEST_REPO.read().unwrap().is_none() {
    let repo = Repo::open(repo_path.as_ref(), DummyCreds)?;
    latest_path.replace(repo_path.as_ref().to_path_buf());
    LATEST_REPO.write().unwrap().replace(RawRepository(repo.0.take().unwrap()));
  }

  drop(latest_path);
  Ok(LATEST_REPO.read().unwrap())
}

pub fn reset_repo() {
  LATEST_REPO_PATH.lock().unwrap().take();
  LATEST_REPO.write().unwrap().take();
}
