use std::fmt::Display;
use std::path::Path;

use git2::build::CheckoutBuilder;
use git2::*;
use serde::Deserialize;

use crate::error::Result;
use crate::prelude::*;

const TAG: &str = "git:reset";

#[derive(Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ResetOptions {
  pub mode: ResetMode,
  pub head: Option<OidInfo>,
}

#[derive(Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub enum ResetMode {
  Soft,
  #[default]
  Mixed,
  Hard,
}

impl Display for ResetMode {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      ResetMode::Soft => write!(f, "soft"),
      ResetMode::Mixed => write!(f, "mixed"),
      ResetMode::Hard => write!(f, "hard"),
    }
  }
}

impl Display for ResetOptions {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match &self.head {
      Some(head) => write!(f, "{} reset to {}", self.mode, head.0),
      None => write!(f, "{} reset to HEAD", self.mode),
    }
  }
}

pub trait Reset {
  fn reset(&self, opts: ResetOptions) -> Result<()>;
  fn restore<I: Iterator<Item = P>, P: AsRef<Path>>(&self, paths: I, staged: bool) -> Result<()>;
}

impl<C: Creds> Reset for Repo<C> {
  fn reset(&self, opts: ResetOptions) -> Result<()> {
    let ResetOptions { mode, head } = &opts;
    info!(target: TAG, "{opts}");

    let commit = match head {
      Some(oid) => self.0.find_commit(oid.parse()?)?,
      None => self.0.head()?.peel_to_commit()?,
    };

    match mode {
      ResetMode::Soft => {
        self.0.reset(commit.as_object(), ResetType::Soft, None)?;
      }
      ResetMode::Mixed => {
        self.0.reset(commit.as_object(), ResetType::Mixed, None)?;
      }
      ResetMode::Hard => {
        let mut opts = CheckoutBuilder::new();
        opts.remove_ignored(true).remove_untracked(true);
        self.0.reset(commit.as_object(), ResetType::Hard, Some(&mut opts))?;
      }
    }

    Ok(())
  }

  fn restore<I: Iterator<Item = P>, P: AsRef<Path>>(&self, paths: I, staged: bool) -> Result<()> {
    info!(target: TAG, "restore{}", if staged { " staged" } else { "" });

    let mut index = self.0.index()?;
    let tree = self.0.head()?.peel_to_tree()?;
    let workdir = self.0.workdir().unwrap_or_else(|| self.0.path());
    for path in paths {
      if staged {
        match tree.get_path(path.as_ref()) {
          Ok(entry) => {
            let index_entry = IndexEntry {
              id: entry.id(),
              path: path.as_ref().as_os_str().as_encoded_bytes().to_vec(),
              mode: entry.filemode() as u32,
              ctime: git2::IndexTime::new(0, 0),
              mtime: git2::IndexTime::new(0, 0),
              dev: 0,
              ino: 0,
              uid: 0,
              gid: 0,
              file_size: 0,
              flags: 0,
              flags_extended: 0,
            };

            index.add(&index_entry)?;
          }
          Err(_) => {
            if let Err(err) = index.remove_path(path.as_ref()) {
              warn!(target: TAG, "failed to remove path {}: {}", path.as_ref().display(), err);
            }
          }
        }

        continue;
      }

      let fs_path = workdir.join(path.as_ref());
      match tree.get_path(path.as_ref()) {
        Ok(entry) => {
          let blob = entry.to_object(&self.0)?.peel_to_blob()?;
          if !fs_path.parent().map(|p| p.exists()).unwrap_or(true) {
            std::fs::create_dir_all(fs_path.parent().unwrap())?;
          }
          std::fs::write(fs_path, blob.content())?;
        }
        Err(err) if matches!((err.class(), err.code()), (ErrorClass::Tree, ErrorCode::NotFound)) => {
          try_remove_path(&fs_path)?;
        }
        Err(err) => return Err(err.into()),
      }
    }

    index.write()?;

    Ok(())
  }
}

fn try_remove_path(path: &Path) -> Result<()> {
  if !path.exists() {
    warn!(target: TAG, "path {} does not exist", path.display());
    return Ok(());
  }

  if std::fs::metadata(path)?.is_dir() {
    std::fs::remove_dir_all(path)?;
    return Ok(());
  }

  std::fs::remove_file(path)?;
  if let Some(parent) = path.parent() {
    if std::fs::metadata(parent)?.is_dir() && parent.read_dir()?.next().is_none() {
      std::fs::remove_dir_all(parent)?;
    }
  }
  Ok(())
}
