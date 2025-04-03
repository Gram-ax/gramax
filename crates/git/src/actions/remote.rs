use git2::*;

use crate::creds::ActualCreds;
use crate::creds::Creds;
use crate::error::Result;
use crate::prelude::Repo;
use crate::remote_callback::*;

const TAG: &str = "git:remote";

pub trait Remote {
  fn add_remote<S: AsRef<str>, U: AsRef<str>>(&self, name: S, url: U) -> Result<()>;
  fn get_remote(&self) -> Result<Option<String>>;
  fn has_remotes(&self) -> Result<bool>;
}

pub trait RemoteConnect {
  fn can_fetch(&self) -> Result<bool>;
  fn can_push(&self) -> Result<bool>;
  fn ensure_remote_connected(&self, remote: &mut git2::Remote, direction: Direction) -> Result<()>;
}

impl<C: Creds> Remote for Repo<C> {
  fn add_remote<S: AsRef<str>, U: AsRef<str>>(&self, name: S, url: U) -> Result<()> {
    info!(target: TAG, "create remote {} pointing to url {}", name.as_ref(), url.as_ref());
    self.0.remote(name.as_ref(), url.as_ref())?;
    Ok(())
  }

  fn get_remote(&self) -> Result<Option<String>> {
    let remote = self.0.find_remote("origin")?;
    Ok(remote.url().map(|u| u.to_string()))
  }

  fn has_remotes(&self) -> Result<bool> {
    Ok(!self.0.remotes()?.is_empty())
  }
}

impl<C: ActualCreds> RemoteConnect for Repo<C> {
  fn can_push(&self) -> Result<bool> {
    let mut remote = self.0.find_remote("origin")?;
    Ok(self.ensure_remote_connected(&mut remote, Direction::Push).is_ok())
  }

  fn can_fetch(&self) -> Result<bool> {
    let mut remote = self.0.find_remote("origin")?;
    Ok(self.ensure_remote_connected(&mut remote, Direction::Fetch).is_ok())
  }

  fn ensure_remote_connected(&self, remote: &mut git2::Remote, direction: Direction) -> Result<()> {
    if !remote.connected() {
      let mut cbs = RemoteCallbacks::new();
      cbs.credentials(make_credentials_callback(&self.1));
      cbs.certificate_check(ssl_callback);

      remote.connect_auth(direction, Some(cbs), None)?;
    }

    Ok(())
  }
}
