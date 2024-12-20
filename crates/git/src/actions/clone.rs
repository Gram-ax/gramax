use core::str;
use std::fmt::Display;
use std::path::PathBuf;
use std::time::Duration;

use build::CheckoutBuilder;
use build::RepoBuilder;
use git2::*;

use crate::creds::ActualCreds;
use crate::remote_callback::*;

use crate::error::Result;
use crate::prelude::Repo;
use crate::time_now;

const TAG: &str = "git:clone";
const CHUNK_TIME_SPAN: Duration = Duration::from_secs(1);

pub type CloneProgressCallback = Box<dyn Fn(CloneProgress)>;

#[derive(serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CloneOptions {
  pub url: String,
  pub to: PathBuf,
  pub branch: Option<String>,
  pub depth: Option<i32>,
  #[serde(default)]
  pub is_bare: bool,
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
  Sideband { remote_text: String },
  ChunkedTransfer { transfer: TransferProgress, bytes: usize, download_speed_bytes: usize },
}

impl Display for CloneProgress {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      CloneProgress::Sideband { remote_text } => write!(f, "remote -> {}", remote_text),
      CloneProgress::ChunkedTransfer { transfer, bytes, download_speed_bytes } => {
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
    }
  }
}

impl CloneProgress {
  pub fn sideband(remote_text: &[u8]) -> Option<Self> {
    let remote_text = String::from_utf8_lossy(remote_text).trim().to_string();
    if remote_text.is_empty() {
      return None;
    }
    Some(Self::Sideband { remote_text })
  }

  pub fn transfer_progress(progress: Progress, last_transfer_bytes: usize) -> Self {
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
      transfer,
      bytes: progress.received_bytes(),
      download_speed_bytes: (progress.received_bytes() - last_transfer_bytes)
        / CHUNK_TIME_SPAN.as_secs() as usize,
    }
  }
}

pub trait Clone<C: ActualCreds> {
  fn clone(creds: C, options: CloneOptions, callback: CloneProgressCallback) -> Result<Repo<C>>;
}

impl<C: ActualCreds> Clone<C> for Repo<C> {
  fn clone(creds: C, opts: CloneOptions, callback: CloneProgressCallback) -> Result<Repo<C>> {
    let CloneOptions { url, to, branch, depth, is_bare } = opts;

    info!(
      target: TAG,
      "cloning {} into {}; branch {}; depth {}; {}",
      url,
      to.as_path().display(),
      branch.as_deref().unwrap_or("<default>"),
      depth.unwrap_or(0),
      if is_bare { "bare" } else { "workdir" }
    );

    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&creds));
    cbs.certificate_check(ssl_callback);

    cbs.sideband_progress(|sideband| {
      if let Some(sideband) = CloneProgress::sideband(sideband) {
        callback(sideband);
      }
      true
    });

    let mut last_transfer_callack = time_now() - CHUNK_TIME_SPAN;
    let mut last_transfer_bytes = 0;
    cbs.transfer_progress(|progress| {
      if time_now() - last_transfer_callack < CHUNK_TIME_SPAN {
        return true;
      }

      last_transfer_callack = time_now();
      let received_bytes = progress.received_bytes();
      let progress = CloneProgress::transfer_progress(progress, last_transfer_bytes);
      callback(progress);
      last_transfer_bytes = received_bytes;
      true
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts
      .remote_callbacks(cbs)
      .update_fetchhead(true)
      .follow_redirects(RemoteRedirect::All)
      .prune(FetchPrune::On)
      .download_tags(AutotagOption::All)
      .add_credentials_headers(&creds);

    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.force();

    if let Some(depth) = depth {
      fetch_opts.depth(depth);
    }

    let to = if is_bare { to.join(".git") } else { to };

    let repo = {
      let mut builder = RepoBuilder::new();
      builder.fetch_options(fetch_opts).bare(is_bare).with_checkout(checkout_opts);
      if let Some(branch) = branch {
        builder.branch(&branch);
      }
      builder.clone(url.as_ref(), to.as_path())?
    };

    let repo = Self(repo, creds);
    repo.ensure_head_exists()?;
    repo.ensure_crlf_configured()?;
    Ok(repo)
  }
}
