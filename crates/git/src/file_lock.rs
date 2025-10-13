use std::io;
use std::io::ErrorKind;
use std::path::Path;
use std::path::PathBuf;
use std::time::Duration;

use serde::Serialize;

pub const FILE_LOCK_TIMEOUT: Duration = Duration::from_secs(2);
pub const FILE_LOCK_PATH: &str = ".gx-lock";

const INTERVAL: Duration = Duration::from_millis(150);

#[derive(Debug)]
pub struct FileLock {
  path: PathBuf,
}

#[derive(Serialize, Debug)]
pub struct FileLockData<'a, T: Serialize> {
  pub cmd: &'a str,
  pub ctx: &'a T,
}

#[derive(Debug)]
pub enum FileLockError {
  WouldBlock(String),
  TimedOut(String),
  Other(io::Error),
}

type Result<T> = std::result::Result<T, FileLockError>;

impl std::fmt::Display for FileLockError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      FileLockError::WouldBlock(data) => write!(f, "lock file would block; ctx: {data}"),
      FileLockError::TimedOut(ctx) => write!(f, "lock file timed out; ctx: {ctx}"),
      FileLockError::Other(e) => write!(f, "lock file other error: {e:?}"),
    }
  }
}

impl FileLock {
  pub fn lock_with_ctx<D: Serialize>(path: PathBuf, data: FileLockData<'_, D>) -> Result<Self> {
    Self::lock_ex(path, Some(data))
  }

  pub fn lock(path: PathBuf) -> Result<Self> {
    Self::lock_ex::<()>(path, None)
  }

  pub fn lock_ex<D: Serialize>(path: PathBuf, data: Option<FileLockData<'_, D>>) -> Result<Self> {
    if let Some(parent) = path.parent() {
      std::fs::create_dir_all(parent).map_err(FileLockError::Other)?;
    }

    match std::fs::OpenOptions::new().create_new(true).write(true).open(&path) {
      Ok(lock_file) => {
        if let Some(data) = data {
          serde_json::to_writer_pretty(&lock_file, &data)
            .map_err(io::Error::other)
            .map_err(FileLockError::Other)?;
          lock_file.sync_all().map_err(FileLockError::Other)?;
        }
        debug!("lock file created: {}", path.display());
        Ok(Self { path })
      }
      Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {
        let data = std::fs::read_to_string(path).map_err(FileLockError::Other)?;
        Err(FileLockError::WouldBlock(data))
      }
      Err(e) => Err(FileLockError::Other(e)),
    }
  }

  pub fn wait(path: &Path, timeout: Duration) -> Result<()> {
    let count = (timeout.as_millis() as u32).div_ceil(INTERVAL.as_millis() as u32);

    for i in 0..count {
      debug!("waiting for lock file: {} ({})", path.display(), i);
      if Self::is_locked(path) {
        std::thread::sleep(INTERVAL);
      } else {
        return Ok(());
      }
    }

    if let Ok(Some(ctx)) = Self::get_locked_ctx(path) {
      Err(FileLockError::TimedOut(ctx))
    } else {
      Err(FileLockError::TimedOut("no ctx".to_string())) // TODO: remove this
    }
  }

  pub fn is_locked(path: &Path) -> bool {
    path.exists()
  }

  pub fn unlock(path: &Path) -> Result<()> {
    match std::fs::remove_file(path) {
      Ok(_) => Ok(()),
      Err(e) if e.kind() == ErrorKind::NotFound => Ok(()),
      Err(e) => Err(FileLockError::Other(e)),
    }
  }

  pub fn get_locked_ctx(path: &Path) -> Result<Option<String>> {
    if !Self::is_locked(path) {
      return Ok(None);
    }

    let content = std::fs::read_to_string(path).map_err(FileLockError::Other)?;
    Ok(Some(content))
  }
}

impl Drop for FileLock {
  fn drop(&mut self) {
    if let Err(err) = std::fs::remove_file(&self.path) {
      error!("failed to remove lock file: {}", err);
    } else {
      debug!("lock file removed: {}", self.path.display());
    }
  }
}
