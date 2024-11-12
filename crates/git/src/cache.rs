use std::ops::Deref;
use std::ops::DerefMut;
use std::path::Path;
use std::path::PathBuf;
use std::sync::LazyLock;
use std::sync::Mutex;
use std::sync::MutexGuard;

use dashmap::DashMap;
use serde::Serialize;

use crate::commands::Result;
use crate::creds::*;
use crate::prelude::*;

static CACHED_REPOS: LazyLock<DashMap<PathBuf, Mutex<Option<git2::Repository>>>> =
  LazyLock::new(DashMap::new);

pub struct RepositoryGuard<'r, C: Creds> {
  repo: Option<Repo<C>>,
  cache_entry: MutexGuard<'r, Option<git2::Repository>>,
}

impl<'r, C: Creds> RepositoryGuard<'r, C> {
  pub fn new(mut cache_entry: MutexGuard<'r, Option<git2::Repository>>, creds: C) -> Self {
    let repo = cache_entry
      .take()
      .expect("Tried to take git2::Repository from MutexGuard but found None; Is something went wrong during last Drop?");

    Self { cache_entry, repo: Some(Repo(repo, creds)) }
  }
}

impl<C: Creds> Deref for RepositoryGuard<'_, C> {
  type Target = Repo<C>;

  fn deref(&self) -> &Self::Target {
    self
      .repo
      .as_ref()
      .expect("Tried to dereference RepositoryGuard but git2::Repository is None; Is something went wrong during last Drop?")
  }
}

impl<C: Creds> DerefMut for RepositoryGuard<'_, C> {
  fn deref_mut(&mut self) -> &mut Self::Target {
    self
      .repo
      .as_mut()
      .expect("Tried to dereference RepositoryGuard but git2::Repository is None; Is something went wrong during last Drop?")
  }
}

impl Repo<DummyCreds> {
  #[inline(always)]
  pub fn execute_without_creds<P: AsRef<Path>, F, R>(repo_path: P, f: F) -> Result<R>
  where
    R: Serialize,
    F: FnOnce(RepositoryGuard<DummyCreds>) -> Result<R>,
  {
    Repo::execute_with_creds(repo_path, DummyCreds, f)
  }
}

impl<C: Creds> Repo<C> {
  #[inline(always)]
  pub fn execute_with_creds<P: AsRef<Path>, R, F>(repo_path: P, creds: C, f: F) -> Result<R>
  where
    R: Serialize,
    F: FnOnce(RepositoryGuard<C>) -> Result<R>,
  {
    let cache_entry = match CACHED_REPOS.get(repo_path.as_ref()) {
      Some(cache_entry) => cache_entry,
      None => {
        let repo = git2::Repository::open(repo_path.as_ref())?;
        CACHED_REPOS.insert(repo_path.as_ref().to_path_buf(), Mutex::new(Some(repo)));
        CACHED_REPOS.get(repo_path.as_ref()).unwrap()
      }
    };

    #[cfg(not(feature = "blocking-cache"))]
    {
      use std::sync::TryLockError;
      let try_lock = cache_entry.try_lock();
      match try_lock {
        Ok(guard) => f(RepositoryGuard::new(guard, creds)),
        Err(TryLockError::WouldBlock) => {
          let mutex = Mutex::new(Some(git2::Repository::open(repo_path.as_ref())?));
          f(RepositoryGuard::new(mutex.lock().unwrap(), creds))
        }
        Err(TryLockError::Poisoned(e)) => {
          panic!(
            "Tried to lock git2::Repository cache mutex which was poisoned by other thread; Details: {}",
            e
          )
        }
      }
    }

    #[cfg(feature = "blocking-cache")]
    f(RepositoryGuard::new(cache_entry.lock().unwrap(), creds))
  }
}

impl<'r, C: Creds> Drop for RepositoryGuard<'r, C> {
  fn drop(&mut self) {
    *self.cache_entry = self.repo.take().map(|r| r.0);
  }
}

pub fn invalidate_cache(repo_paths: Vec<PathBuf>) -> Result<()> {
  CACHED_REPOS.retain(|path, _| repo_paths.contains(path));
  Ok(())
}
