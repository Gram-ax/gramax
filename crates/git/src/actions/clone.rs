use std::path::PathBuf;

use git2::build::CheckoutBuilder;
use git2::build::RepoBuilder;
use git2::*;

use crate::cancel_token::CancelToken;
use crate::creds::ActualCreds;
use crate::ext::lfs::Lfs;
use crate::refmut::RefOrMut;

use crate::file_lock::*;
use crate::remote_callback::*;

use crate::error::Result;
use crate::prelude::*;
use crate::time_now;

use crate::remote_progress::*;

const TAG: &str = "git:clone";

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CloneOptions {
  pub url: String,
  pub to: PathBuf,
  pub branch: Option<String>,
  pub depth: Option<i32>,
  pub cancel_token: usize,
  #[serde(default)]
  pub allow_non_empty_dir: bool,
  #[serde(default)]
  pub is_bare: bool,
}

pub trait Clone<C: ActualCreds> {
  fn clone(creds: C, options: CloneOptions, callback: RemoteProgressCallback) -> Result<()>;
  fn cancel(id: usize) -> Result<bool>;
}

impl<C: ActualCreds> Clone<C> for Repo<'_, C> {
  fn clone(creds: C, opts: CloneOptions, callback: RemoteProgressCallback) -> Result<()> {
    let lock_file_ctx = opts.clone();
    let lock_path = opts.to.join(".git").join(FILE_LOCK_PATH);
    let lock_file = std::sync::OnceLock::new();

    let CloneOptions { url, to, branch, depth, is_bare, allow_non_empty_dir, cancel_token } = opts;

    if !allow_non_empty_dir && to.exists() && std::fs::read_dir(&to)?.next().is_some() {
      let err = git2::Error::new(
        ErrorCode::Exists,
        ErrorClass::Invalid,
        format!("dir `{}` is not empty", to.display()),
      );

      return Err(err.into());
    }

    let to = if is_bare { to.join(".git") } else { to };

    let cancel_token = match CancelToken::is_active(cancel_token) {
      false => CancelToken::new_with_cleanup(cancel_token, Box::new(|| cleanup(to.as_path()))),
      true => {
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

    let cbs = creds.create_remote_transfer_callbacks(cancel_token.clone(), callback.clone());

    let mut fetch_opts = FetchOptions::new();
    fetch_opts
      .remote_callbacks(cbs)
      .update_fetchhead(true)
      .follow_redirects(RemoteRedirect::All)
      .prune(FetchPrune::On)
      .download_tags(AutotagOption::All)
      .add_credentials_headers(&creds);

    if let Some(depth) = depth {
      fetch_opts.depth(depth);
    }

    let repo = {
      let mut checkout_opts_none = CheckoutBuilder::new();
      checkout_opts_none.dry_run();
      let mut builder = RepoBuilder::new();
      builder.fetch_options(fetch_opts).bare(is_bare).with_checkout(checkout_opts_none);
      if let Some(branch) = branch {
        builder.branch(&branch);
      }

      builder.remote_create(|repo, name, url| {
        lock_file
          .get_or_init(|| {
            FileLock::lock_with_ctx(lock_path.clone(), FileLockData { cmd: "clone", ctx: &lock_file_ctx })
          })
          .as_ref()
          .map_err(|e| Error::from_str(&e.to_string()))?;

        repo.remote(name, url)
      });
      builder.clone(url.as_ref(), to.as_path())?
    };

    let mut last_checkout_callback = time_now() - CHUNK_TIME_SPAN;

    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.force();

    checkout_opts.progress(|_, checkouted, total| {
      if time_now() - last_checkout_callback < CHUNK_TIME_SPAN {
        return;
      }

      last_checkout_callback = time_now();
      callback(RemoteProgress::checkout_progress(cancel_token.id(), checkouted, total));
    });

    checkout_opts.notify_on(CheckoutNotificationType::all());
    checkout_opts.notify(|_, _, _, _, _| !cancel_token.is_cancelled());

    let repo = Self(RefOrMut::Owned(repo), creds);

    match repo.0.head().and_then(|h| h.peel_to_tree()) {
      Ok(tree) => {
        repo.pull_missing_lfs_objects(&tree, cancel_token.clone())?;

        if !is_bare {
          repo.0.checkout_tree(tree.as_object(), Some(&mut checkout_opts))?;
        }
      }
      Err(e) => {
        error!(target: TAG, "cloned repository has no head; skipping checkout and lfs pull; original error: {}", e);
      }
    }

    drop(checkout_opts);

    if cancel_token.is_cancelled() {
      return Ok(());
    }

    if !repo.can_push()? && repo.1.access_token().is_empty() {
      info!(target: TAG, "access token wasn't provided, deleting the remote `origin`");
      repo.0.remote_delete("origin")?;
    }

    info!(target: TAG, "clone completed");

    repo.ensure_head_exists()?;
    repo.ensure_crlf_configured()?;

    drop(lock_file);
    drop(cancel_token);
    Ok(())
  }

  fn cancel(id: usize) -> Result<bool> {
    Ok(CancelToken::new(id).cancel())
  }
}

fn cleanup(path: &std::path::Path) {
  match std::fs::exists(path) {
    Ok(true) => {
      if let Err(err) = std::fs::remove_dir_all(path) {
        error!(target: TAG, "failed to cleanup clone on {}, {}", path.display(), err);
      }
    }
    Ok(false) => {
      warn!(target: TAG, "called cleanup clone on {}, but the path was not found", path.display());
    }
    Err(e) => error!(target: TAG, "failed to cleanup clone on {}, {}", path.display(), e),
  }
}
