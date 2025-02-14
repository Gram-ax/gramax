use std::path::Path;
use std::path::PathBuf;

use serde::Serialize;

use crate::commands::Result;
use crate::creds::*;
use crate::prelude::*;

use std::ops::Deref;
use std::ops::DerefMut;
use std::sync::Mutex;
use std::sync::MutexGuard;

static LATEST_REPO: (Mutex<Option<PathBuf>>, Mutex<Option<RawRepository>>) =
  (Mutex::new(None), Mutex::new(None));

const REPO_DEREF_ERROR: &str = "Tried to dereference RepositoryGuard but git2::Repository is None; Did something go wrong during the last Drop?";

pub struct RawRepository(git2::Repository);

pub enum RepositoryGuard<'r, C: Creds> {
  Locked { repo: Option<Repo<C>>, guard: MutexGuard<'r, Option<RawRepository>> },
  Unlocked { repo: Option<Repo<C>> },
}

impl<'r, C: Creds> RepositoryGuard<'r, C> {
  pub fn new_locked(mut guard: MutexGuard<'r, Option<RawRepository>>, creds: C) -> Self {
    let repo = guard.take().expect(REPO_DEREF_ERROR);

    Self::Locked { guard, repo: Some(Repo(repo.0, creds)) }
  }

  pub fn new_unlocked(repo: Repo<C>) -> Self {
    Self::Unlocked { repo: Some(repo) }
  }
}

impl<C: Creds> Deref for RepositoryGuard<'_, C> {
  type Target = Repo<C>;

  fn deref(&self) -> &Self::Target {
    match self {
      RepositoryGuard::Locked { repo, .. } | RepositoryGuard::Unlocked { repo } => {
        repo.as_ref().expect(REPO_DEREF_ERROR)
      }
    }
  }
}

impl<C: Creds> DerefMut for RepositoryGuard<'_, C> {
  fn deref_mut(&mut self) -> &mut Self::Target {
    match self {
      RepositoryGuard::Locked { repo, .. } | RepositoryGuard::Unlocked { repo } => {
        repo.as_mut().expect(REPO_DEREF_ERROR)
      }
    }
  }
}

impl Repo<DummyCreds> {
  #[inline(always)]
  pub fn execute_without_creds_try_lock<P: AsRef<Path>, F, R>(repo_path: P, f: F) -> Result<R>
  where
    R: Serialize,
    F: FnOnce(RepositoryGuard<DummyCreds>) -> Result<R>,
  {
    Repo::execute_with_creds_try_lock(repo_path, DummyCreds, f)
  }

  #[inline(always)]
  pub fn execute_without_creds_lock<P: AsRef<Path>, F, R>(repo_path: P, f: F) -> Result<R>
  where
    R: Serialize,
    F: FnOnce(RepositoryGuard<DummyCreds>) -> Result<R>,
  {
    Repo::execute_with_creds_lock(repo_path, DummyCreds, f)
  }
}

impl<C: Creds> Repo<C> {
  #[inline(always)]
  pub fn execute_with_creds_lock<P: AsRef<Path>, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    R: Serialize,
    F: FnOnce(RepositoryGuard<C>) -> Result<R>,
  {
    f(Self::lock(repo_path, creds)?)
  }

  #[inline(always)]
  pub fn execute_with_creds_try_lock<P: AsRef<Path>, F, R>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    R: Serialize,
    F: FnOnce(RepositoryGuard<C>) -> Result<R>,
  {
    f(Self::try_lock(repo_path, creds)?)
  }

  #[inline(always)]
  fn lock<'g, P: AsRef<Path>>(repo_path: P, creds: C) -> Result<RepositoryGuard<'g, C>> {
    let mut latest_path = LATEST_REPO.0.lock().unwrap();
    let mut latest_repo = LATEST_REPO.1.lock().unwrap();

    if latest_path.as_ref().is_none_or(|r| r != repo_path.as_ref()) {
      latest_path.replace(repo_path.as_ref().to_path_buf());
      latest_repo.replace(RawRepository(git2::Repository::open(repo_path.as_ref())?));
    }

    let latest_repo = match latest_repo.as_ref() {
      Some(_) => latest_repo,
      None => {
        let repo = RawRepository(git2::Repository::open(latest_path.as_ref().unwrap())?);
        latest_repo.replace(repo);
        latest_repo
      }
    };

    drop(latest_path);
    Ok(RepositoryGuard::new_locked(latest_repo, creds))
  }

  #[inline(always)]
  #[cfg(not(target_family = "wasm"))]
  fn try_lock<'g, P: AsRef<Path>>(repo_path: P, creds: C) -> Result<RepositoryGuard<'g, C>> {
    use std::sync::TryLockError;

    let mut latest_path = LATEST_REPO.0.lock().unwrap();

    if latest_path.as_ref().is_none_or(|r| r != repo_path.as_ref()) {
      latest_path.replace(repo_path.as_ref().to_path_buf());
      LATEST_REPO.1.lock().unwrap().replace(RawRepository(git2::Repository::open(repo_path.as_ref())?));
    }

    match LATEST_REPO.1.try_lock() {
      Ok(guard) => {
        drop(guard);
        drop(latest_path);
        Self::lock(repo_path, creds)
      }
      Err(TryLockError::WouldBlock) => {
        let repo = RawRepository(git2::Repository::open(latest_path.as_ref().unwrap())?);
        drop(latest_path);
        Ok(RepositoryGuard::new_unlocked(Repo(repo.0, creds)))
      }
      Err(TryLockError::Poisoned(_)) => panic!("Poisoned repository mutex received"),
    }
  }

  #[inline(always)]
  #[cfg(target_family = "wasm")]
  fn try_lock<'g, P: AsRef<Path>>(repo_path: P, creds: C) -> Result<RepositoryGuard<'g, C>> {
    Self::lock(repo_path, creds)
  }
}

impl<C: Creds> Drop for RepositoryGuard<'_, C> {
  fn drop(&mut self) {
    if let RepositoryGuard::Locked { guard, repo } = self {
      **guard = repo.take().map(|r| RawRepository(r.0));
    }
  }
}

pub fn reset_repo() {
  LATEST_REPO.0.lock().unwrap().take();
  LATEST_REPO.1.lock().unwrap().take();
}
