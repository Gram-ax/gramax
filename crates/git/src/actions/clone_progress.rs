use git2::*;

use std::collections::HashSet;
use std::fmt::Display;
use std::path::Path;
use std::sync::LazyLock;
use std::sync::RwLock;
use std::time::Duration;

use crate::error::*;

pub type CloneProgressCallback<'c> = Box<dyn Fn(CloneProgress) + 'c>;

const TAG: &str = "git:clone-progress";

pub(super) const CHUNK_TIME_SPAN: Duration = Duration::from_secs(1);

static CLONING: LazyLock<RwLock<HashSet<usize>>> = LazyLock::new(|| RwLock::new(HashSet::new()));

pub(super) struct CloneCancel<'id> {
  id: usize,
  to: &'id str,
}

impl<'id> CloneCancel<'id> {
  pub fn new(id: usize, to: &'id Path) -> Result<Self> {
    let to = to.to_str().or_utf8_err()?;
    if !CLONING.write().unwrap().insert(id) {
      return Err(crate::error::Error::AlreadyCloningWithSameId(format!("{}", id)));
    }

    Ok(Self { id, to })
  }

  pub fn id(&self) -> usize {
    self.id
  }

  pub fn is_cancelled(&self) -> bool {
    !CLONING.read().unwrap().contains(&self.id)
  }

  pub fn cancel(id: usize) -> bool {
    CLONING.write().unwrap().remove(&id)
  }

  fn cleanup(&self) {
    match std::fs::exists(self.to) {
      Ok(true) => {
        if let Err(err) = std::fs::remove_dir_all(self.to) {
          error!(target: TAG, "failed to cleanup clone on {}, {}", self.to, err);
        }
      }
      Ok(false) => {
        warn!(target: TAG, "called cleanup clone on {}, but the path was not found", self.to);
      }
      Err(e) => error!(target: TAG, "failed to cleanup clone on {}, {}", self.to, e),
    }
  }
}

impl Drop for CloneCancel<'_> {
  fn drop(&mut self) {
    if self.is_cancelled() {
      self.cleanup();
    } else {
      CLONING.write().unwrap().remove(&self.id);
    }
  }
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum TransferProgress {
  IndexingDeltas { indexed: usize, total: usize },
  ReceivingObjects { received: usize, indexed: usize, total: usize },
}

#[derive(serde::Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum CloneProgress {
  Sideband {
    id: usize,
    remote_text: String,
  },
  #[serde(rename_all = "camelCase")]
  ChunkedTransfer {
    id: usize,
    transfer: TransferProgress,
    bytes: usize,
    download_speed_bytes: usize,
  },
  Checkout {
    id: usize,
    checkouted: usize,
    total: usize,
  },
}

impl Display for CloneProgress {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      CloneProgress::Sideband { remote_text, .. } => write!(f, "remote -> {}", remote_text),
      CloneProgress::ChunkedTransfer { transfer, bytes, download_speed_bytes, .. } => {
        match transfer {
          TransferProgress::ReceivingObjects { received, indexed, total } => {
            write!(f, "receiving objects -> received: {}, indexed: {}, total: {}", received, indexed, total)
          }
          TransferProgress::IndexingDeltas { indexed, total } => {
            write!(f, "indexing deltas -> indexed: {}, total: {}", indexed, total)
          }
        }?;
        write!(
          f,
          ", {:.3}mb {:.3}mb/s",
          *bytes as f64 / 1024.0 / 1024.0,
          *download_speed_bytes as f64 / 1024.0 / 1024.0
        )
      }
      CloneProgress::Checkout { checkouted, total, .. } => {
        write!(f, "checkout progress -> checked out: {}, total: {}", checkouted, total)
      }
    }
  }
}

impl CloneProgress {
  pub fn sideband(id: usize, remote_text: &[u8]) -> Option<Self> {
    let remote_text = String::from_utf8_lossy(remote_text).trim().to_string();
    if remote_text.is_empty() {
      return None;
    }
    Some(Self::Sideband { id, remote_text })
  }

  pub fn transfer_progress(id: usize, progress: Progress, last_transfer_bytes: usize) -> Self {
    let transfer = if progress.total_objects() == progress.received_objects() {
      TransferProgress::IndexingDeltas { indexed: progress.indexed_deltas(), total: progress.total_deltas() }
    } else {
      TransferProgress::ReceivingObjects {
        received: progress.received_objects(),
        indexed: progress.indexed_objects(),
        total: progress.total_objects(),
      }
    };

    Self::ChunkedTransfer {
      id,
      transfer,
      bytes: progress.received_bytes(),
      download_speed_bytes: (progress.received_bytes() - last_transfer_bytes)
        / CHUNK_TIME_SPAN.as_secs() as usize,
    }
  }

  pub fn checkout_progress(id: usize, checkedout: usize, total: usize) -> Self {
    Self::Checkout { id, checkouted: checkedout, total }
  }
}
