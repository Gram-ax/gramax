use std::borrow::Cow;
use std::ops::Deref;

use git2::*;
use serde::Serialize;

use crate::creds::ActualCreds;
use crate::remote_callback::*;

use crate::creds::Creds;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::prelude::Repo;
use crate::ShortInfo;

use super::remote::RemoteConnect;

const TAG: &str = "git:branch";

pub trait Branch {
  fn branches(&self, branch_type: Option<BranchType>) -> Result<Branches>;
  fn branch_by_name<S: AsRef<str>>(
    &self,
    shorthand: S,
    branch_type: Option<BranchType>,
  ) -> Result<BranchEntry<'_>>;
  fn branch_by_head(&self) -> Result<BranchEntry<'_>>;
  fn new_branch<S: AsRef<str>>(&self, shorthand: S) -> Result<BranchEntry<'_>>;

  fn delete_branch_local<S: AsRef<str>>(&self, shorthand: S) -> Result<()>;
  fn ensure_branch_exists_local<S: AsRef<str>>(&self, shorthand: S) -> Result<()>;
  fn ensure_branch_has_upstream<S: AsRef<str>>(&self, shorthand: S) -> Result<bool>;
}

pub trait RemoteBranch {
  fn delete_branch_remote<S: AsRef<str>>(&self, shorthand: S) -> Result<()>;
  fn create_branch_remote<S: AsRef<str>>(&self, shorthand: S) -> Result<()>;
  fn default_branch(&self) -> Result<Option<BranchEntry<'_>>>;
  fn ensure_branch_exists(&self, shorthand: &str) -> Result<()>;
}

pub struct BranchEntry<'b> {
  pub last_commit: Commit<'b>,
  pub branch: git2::Branch<'b>,
  pub kind: BranchType,
}

impl<'b> Deref for BranchEntry<'b> {
  type Target = git2::Branch<'b>;

  fn deref(&self) -> &Self::Target {
    &self.branch
  }
}

impl<'a> From<((git2::Branch<'a>, BranchType), Commit<'a>)> for BranchEntry<'a> {
  fn from(value: ((git2::Branch<'a>, BranchType), Commit<'a>)) -> Self {
    let branch = value.0;
    Self { last_commit: value.1, branch: branch.0, kind: branch.1 }
  }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BranchInfo {
  pub name: String,
  pub modify: i64,
  pub last_author_name: String,
  pub last_author_email: String,
  pub last_commit_oid: String,
  pub remote_name: Option<String>,
}

impl ShortInfo<'_, BranchInfo> for BranchEntry<'_> {
  fn short_info(&self) -> Result<BranchInfo> {
    let remote_name = match self.kind {
      BranchType::Local => match self.upstream() {
        Ok(upstream) => upstream.name()?.map(|x| x.replace("origin/", "")),
        Err(err) => match err {
          err if err.code() == ErrorCode::NotFound => None,
          err => return Err(err.into()),
        },
      },
      BranchType::Remote => None,
    };

    let (name, remote_name) = match self.kind {
      BranchType::Local => (self.name()?.or_utf8_err()?.to_owned(), remote_name),
      BranchType::Remote => {
        let name = self.name()?.or_utf8_err()?.replace("origin/", "");
        (name.clone(), Some(name))
      }
    };

    let author = self.last_commit.author();
    let info = BranchInfo {
      name,
      modify: self.last_commit.time().seconds(),
      last_author_name: author.name().or_utf8_err()?.into(),
      last_author_email: author.email().or_utf8_err()?.into(),
      last_commit_oid: self.last_commit.id().to_string(),
      remote_name,
    };
    Ok(info)
  }
}

impl<C: Creds> Branch for Repo<C> {
  fn branches(&self, branch_type: Option<BranchType>) -> Result<Branches> {
    Ok(self.0.branches(branch_type)?)
  }

  fn branch_by_name<S: AsRef<str>>(
    &self,
    shorthand: S,
    branch_type: Option<BranchType>,
  ) -> Result<BranchEntry<'_>> {
    let branch_type = match branch_type {
      Some(branch_type) => branch_type,
      None if shorthand.as_ref().starts_with("origin/") => BranchType::Remote,
      None => {
        return self
          .branch_by_name(shorthand.as_ref(), Some(BranchType::Local))
          .or_else(|_| self.branch_by_name(shorthand.as_ref(), Some(BranchType::Remote)))
      }
    };

    let shorthand = if branch_type == BranchType::Remote && !shorthand.as_ref().contains("origin/") {
      Cow::Owned(format!("origin/{}", shorthand.as_ref()))
    } else {
      Cow::Borrowed(shorthand.as_ref())
    };

    let branch = self.0.find_branch(shorthand.as_ref(), branch_type)?;
    self.resolve_branch_entry((branch, branch_type))
  }

  fn branch_by_head(&self) -> Result<BranchEntry<'_>> {
    let head = self.0.head()?;
    self.branch_by_name(head.shorthand().or_utf8_err()?, Some(BranchType::Local))
  }

  fn new_branch<S: AsRef<str>>(&self, shorthand: S) -> Result<BranchEntry<'_>> {
    info!(target: TAG, "create new branch named {}", shorthand.as_ref());

    let Some(head_ref) = self.0.head()?.target() else {
      let message = "HEAD has no direct reference";
      let err = git2::Error::new(ErrorCode::Invalid, ErrorClass::Reference, message).into();
      return Err(err);
    };

    let commit = self.0.find_commit(head_ref)?;
    let branch = (self.0.branch(shorthand.as_ref(), &commit, false)?, BranchType::Local);
    if !self.0.is_bare() {
      self.0.checkout_tree(branch.0.get().peel_to_tree()?.as_object(), None)?
    };
    self.0.set_head(branch.0.get().name().or_utf8_err()?)?;
    Ok((branch, commit).into())
  }

  fn delete_branch_local<S: AsRef<str>>(&self, shorthand: S) -> Result<()> {
    info!(target: TAG, "delete local branch {}", shorthand.as_ref());
    let mut branch = self.0.find_branch(shorthand.as_ref(), BranchType::Local)?;
    branch.delete()?;
    Ok(())
  }

  fn ensure_branch_exists_local<S: AsRef<str>>(&self, shorthand: S) -> Result<()> {
    match self.0.find_branch(shorthand.as_ref(), BranchType::Local) {
      Ok(branch) => branch,
      Err(err) if err.code() == ErrorCode::NotFound => {
        warn!(target: TAG, "branch {} does not exist; creating it", shorthand.as_ref());

        let commit = match self.0.find_branch(&format!("origin/{}", shorthand.as_ref()), BranchType::Remote) {
          Ok(remote_branch) => remote_branch.get().peel_to_commit()?,
          Err(_) => return Err(err.into()),
        };

        self.0.branch(shorthand.as_ref(), &commit, false)?
      }
      Err(err) => {
        return Err(err.into());
      }
    };
    Ok(())
  }

  fn ensure_branch_has_upstream<S: AsRef<str>>(&self, shorthand: S) -> Result<bool> {
    let Ok(mut branch) = self.0.find_branch(shorthand.as_ref(), BranchType::Local) else {
      warn!(target: TAG, "branch {} does not exist; skipping upstream setting", shorthand.as_ref());
      return Ok(false);
    };

    if branch.upstream().is_ok() {
      return Ok(false);
    }

    let remote_name = format!("origin/{}", branch.name()?.or_utf8_err()?);

    let Ok(_) = self.0.find_branch(&remote_name, BranchType::Remote) else {
      warn!(target: TAG, "remote branch {} does not exist; skipping upstream setting", remote_name);
      return Ok(true);
    };

    branch.set_upstream(Some(&remote_name))?;
    Ok(false)
  }
}

impl<C: ActualCreds> RemoteBranch for Repo<C> {
  fn delete_branch_remote<S: AsRef<str>>(&self, shorthand: S) -> Result<()> {
    info!(target: TAG, "delete branch {}; pushing to origin", shorthand.as_ref());
    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    cbs.push_update_reference(push_update_reference_callback);

    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(cbs);
    push_opts.follow_redirects(RemoteRedirect::All);
    push_opts.add_credentials_headers(&self.1);

    let mut branch = self.0.find_branch(&format!("origin/{}", shorthand.as_ref()), BranchType::Remote)?;
    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_has_postfix(&remote)?;
    branch.delete()?;
    remote.push(&[&format!(":refs/heads/{}", shorthand.as_ref())], Some(&mut push_opts))?;
    Ok(())
  }

  fn default_branch(&self) -> Result<Option<BranchEntry<'_>>> {
    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_connected(&mut remote, Direction::Fetch)?;

    let branch_buf = remote.default_branch()?;
    let Some(branch) = branch_buf.as_str() else {
      return Ok(None);
    };

    let shorthand = branch.strip_prefix("refs/heads/").unwrap_or(branch);
    let branch = self.branch_by_name(shorthand, Some(BranchType::Local))?;
    Ok(Some(branch))
  }

  fn create_branch_remote<S: AsRef<str>>(&self, shorthand: S) -> Result<()> {
    let mut push_opts = PushOptions::new();

    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    cbs.push_update_reference(push_update_reference_callback);

    push_opts.follow_redirects(RemoteRedirect::All);
    push_opts.remote_callbacks(cbs);

    let refspec = format!("refs/heads/{}:refs/heads/{}", shorthand.as_ref(), shorthand.as_ref());
    info!(target: TAG, "create remote branch {}; pushing refspec {} to origin", shorthand.as_ref(), refspec);

    let mut remote = self.0.find_remote("origin")?;
    remote.push(&[&refspec], Some(&mut push_opts))?;
    Ok(())
  }

  fn ensure_branch_exists(&self, shorthand: &str) -> Result<()> {
    self.ensure_branch_exists_local(shorthand)?;

    match self.0.find_branch(&format!("origin/{}", shorthand), BranchType::Remote) {
      Ok(_) => (),
      Err(err) if err.code() == ErrorCode::NotFound => {
        warn!(target: TAG, "branch {} does not exist; creating it", shorthand);
        self.create_branch_remote(shorthand)?;
      }
      Err(err) => {
        return Err(err.into());
      }
    };

    Ok(())
  }
}
