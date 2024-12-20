use crate::creds::Creds;
use crate::error::Result;
use crate::prelude::Repo;

const TAG: &str = "git:remote";

pub trait Remote {
  fn add_remote<S: AsRef<str>, U: AsRef<str>>(&self, name: S, url: U) -> Result<()>;
  fn get_remote(&self) -> Result<Option<String>>;
  fn has_remotes(&self) -> Result<bool>;
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
