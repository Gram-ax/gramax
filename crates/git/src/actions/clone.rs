use std::path::PathBuf;

use build::CheckoutBuilder;
use build::RepoBuilder;
use git2::*;

use crate::creds::ActualCreds;
use crate::creds::Creds;
use crate::prelude::RemoteConnect;
use crate::refmut::RefOrMut;
use crate::remote_callback::*;

use crate::error::Result;
use crate::prelude::Repo;
use crate::time_now;

use super::clone_progress::*;

pub use super::clone_progress::CloneProgress;
pub use super::clone_progress::CloneProgressCallback;

const TAG: &str = "git:clone";

#[derive(serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CloneOptions {
  pub url: String,
  pub to: PathBuf,
  pub branch: Option<String>,
  pub depth: Option<i32>,
  pub cancel_token: usize,
  #[serde(default)]
  pub is_bare: bool,
}

pub trait Clone<C: ActualCreds> {
  fn clone(creds: C, options: CloneOptions, callback: CloneProgressCallback) -> Result<()>;
  fn clone_cancel(id: usize) -> Result<bool>;
}

pub trait CloneExt {
  fn get_all_cancel_tokens() -> Vec<usize>;
}

impl<C: Creds> CloneExt for Repo<'_, C> {
  fn get_all_cancel_tokens() -> Vec<usize> {
    CloneCancel::get_all_cancel_tokens()
  }
}

impl<C: ActualCreds> Clone<C> for Repo<'_, C> {
  fn clone(creds: C, opts: CloneOptions, callback: CloneProgressCallback) -> Result<()> {
    let CloneOptions { url, to, branch, depth, is_bare, cancel_token } = opts;

    let to = if is_bare { to.join(".git") } else { to };

    let cancel_token = match CloneCancel::new(cancel_token, to.as_path()) {
      Ok(cancel_token) => cancel_token,
      Err(_) => {
        warn!(target: TAG, "failed to start clone; repo at {} is already cloning; cancelling previous clone", to.as_path().display());
        return Ok(());
      }
    };

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
      if let Some(sideband) = CloneProgress::sideband(cancel_token.id(), sideband) {
        callback(sideband);
      }
      !cancel_token.is_cancelled()
    });

    let mut last_transfer_callback = time_now() - CHUNK_TIME_SPAN;
    let mut last_transfer_bytes = 0;

    cbs.transfer_progress(|progress| {
      if time_now() - last_transfer_callback < CHUNK_TIME_SPAN {
        return true;
      }

      last_transfer_callback = time_now();
      let received_bytes = progress.received_bytes();
      callback(CloneProgress::transfer_progress(cancel_token.id(), progress, last_transfer_bytes));
      last_transfer_bytes = received_bytes;
      !cancel_token.is_cancelled()
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

    let mut last_checkout_callack = time_now() - CHUNK_TIME_SPAN;
    checkout_opts.progress(|_, checkouted, total| {
      if time_now() - last_checkout_callack < CHUNK_TIME_SPAN {
        return;
      }

      last_checkout_callack = time_now();
      callback(CloneProgress::checkout_progress(cancel_token.id(), checkouted, total));
    });

    checkout_opts.notify_on(CheckoutNotificationType::all());
    checkout_opts.notify(|_, _, _, _, _| !cancel_token.is_cancelled());

    if let Some(depth) = depth {
      fetch_opts.depth(depth);
    }

    let repo = {
      let mut builder = RepoBuilder::new();
      builder.fetch_options(fetch_opts).bare(is_bare).with_checkout(checkout_opts);
      if let Some(branch) = branch {
        builder.branch(&branch);
      }
      builder.clone(url.as_ref(), to.as_path())?
    };

    if cancel_token.is_cancelled() {
      return Ok(());
    }

    let repo = Self(RefOrMut::Owned(repo), creds);

    if !repo.can_push()? && repo.1.access_token().is_empty() {
      info!(target: TAG, "access token wasn't provided, deleting the remote `origin`");
      repo.0.remote_delete("origin")?;
    }

    info!(target: TAG, "clone completed");

    repo.ensure_head_exists()?;
    repo.ensure_crlf_configured()?;

    Ok(())
  }

  fn clone_cancel(id: usize) -> Result<bool> {
    Ok(CloneCancel::cancel(id))
  }
}
