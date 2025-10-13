use crate::cancel_token::CancelToken;
use crate::error::Error;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::ext::walk::Walk;
use crate::prelude::*;

const TAG: &str = "git:recover";

pub trait Recover {
  fn recover<'c>(&mut self, cancel: CancelToken<'c>, on_progress: RemoteProgressCallback<'c>) -> Result<()>;
}

impl<C: ActualCreds> Recover for Repo<'_, C> {
  fn recover<'c>(&mut self, cancel: CancelToken<'c>, on_progress: RemoteProgressCallback<'c>) -> Result<()> {
    let initial_healthcheck = self.healthcheck()?;

    if initial_healthcheck.is_empty() {
      info!(target: TAG, "no bad objects found; skipping recovery");
      return Ok(());
    }

    info!(target: TAG, "found {} bad objects; recovering", initial_healthcheck.len());

    let local_refs = self.find_local_refs()?;
    let mut refs = vec![];

    let head_refname = self.0.head().ok().and_then(|h| h.name().map(|n| n.to_string()));

    for reference in self.repo().references()? {
      let mut reference = reference?;
      refs.push(reference.name().or_utf8_err()?.to_string());
      reference.delete()?;
    }

    info!(target: TAG, "removed {} references ({}, {} local-only)", refs.len(), refs.join(", "), local_refs.len());

    let dot_git_path = self.repo().path().to_path_buf();

    let index_path = dot_git_path.join("index");
    if index_path.exists() {
      std::fs::remove_file(dot_git_path.join("index"))?;
    }
    std::fs::remove_dir_all(dot_git_path.join("objects"))?;
    std::fs::create_dir_all(dot_git_path.join("objects/pack"))?;

    self.reopen()?;

    info!(target: TAG, "removed all objects; now fetching");

    self.fetch(RemoteOptions::new(cancel.clone()).force(), on_progress.clone())?;

    let head_ref = head_refname.as_ref().and_then(|refname| {
      self
        .repo()
        .find_reference(refname)
        .ok()
        .inspect(|r| info!(target: TAG, "head ref: {}", r.name().unwrap_or_default()))
    });

    if let Some(head_ref) = head_ref {
        self.0.set_head(head_ref.name().or_utf8_err()?)?;
    } else {
      let default_branch = self.default_branch()?;
      if let Some(default_branch) = default_branch {
        self.0.set_head(default_branch.get().name().or_utf8_err()?)?;
      } else {
        warn!(target: TAG, "no default branch found; can not set head")
      }
    }

    let healthcheck = self.healthcheck()?;

    if !healthcheck.is_empty() {
      info!(target: TAG, "bad objects still found; recovery failed");
      let err = HealthcheckError { bad_objects: Some(healthcheck), inner: None, prev_log: None };
      return Err(Error::Healthcheck(err));
    }

    self.add_all()?;

    crate::cache::reset_file_lock(self.0.workdir().ok_or(Error::NoWorkdir)?);

    info!(target: TAG, "recovery successful; no bad objects found");
    Ok(())
  }
}
