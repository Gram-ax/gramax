use std::borrow::Cow;
use std::ops::Deref;

use git2::*;
use serde::Serialize;

use crate::creds::ActualCreds;
use crate::remote_callback::*;

use crate::creds::Creds;
use crate::error::Error;
use crate::error::Result;
use crate::prelude::Repo;
use crate::ShortInfo;

const TAG: &str = "git:branch";

pub trait Branch {
  fn branches(&self, branch_type: Option<BranchType>) -> Result<Branches>;
  fn branch_by_name<S: AsRef<str>>(&self, shorthand: S, branch_type: BranchType) -> Result<BranchEntry<'_>>;
  fn branch_by_head(&self) -> Result<BranchEntry<'_>>;
  fn new_branch<S: AsRef<str>>(&self, shorthand: S) -> Result<BranchEntry<'_>>;

  fn delete_branch_local<S: AsRef<str>>(&self, shorthand: S) -> Result<()>;
}

pub trait RemoteBranch {
  fn delete_branch_remote<S: AsRef<str>>(&self, shorthand: S) -> Result<()>;
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
      BranchType::Local => (self.name()?.ok_or(Error::Utf8)?.to_owned(), remote_name),
      BranchType::Remote => {
        let name = self.name()?.ok_or(Error::Utf8)?.replace("origin/", "");
        (name.clone(), Some(name))
      }
    };

    let author = self.last_commit.author();
    let info = BranchInfo {
      name,
      modify: self.last_commit.time().seconds(),
      last_author_name: author.name().ok_or(Error::Utf8)?.into(),
      last_author_email: author.email().ok_or(Error::Utf8)?.into(),
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

  fn branch_by_name<S: AsRef<str>>(&self, shorthand: S, branch_type: BranchType) -> Result<BranchEntry<'_>> {
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
    self.branch_by_name(head.shorthand().ok_or(Error::Utf8)?, BranchType::Local)
  }

  fn new_branch<S: AsRef<str>>(&self, shorthand: S) -> Result<BranchEntry<'_>> {
    info!(target: TAG, "create new branch named {}", shorthand.as_ref());
    let commit = self.0.find_commit(self.0.head()?.target().ok_or(Error::Utf8)?)?;
    let branch = (self.0.branch(shorthand.as_ref(), &commit, false)?, BranchType::Local);
    if !self.0.is_bare() {
      self.0.checkout_tree(branch.0.get().peel_to_tree()?.as_object(), None)?
    };
    self.0.set_head(branch.0.get().name().ok_or(Error::Utf8)?)?;
    Ok((branch, commit).into())
  }

  fn delete_branch_local<S: AsRef<str>>(&self, shorthand: S) -> Result<()> {
    info!(target: TAG, "delete local branch {}", shorthand.as_ref());
    let mut branch = self.0.find_branch(shorthand.as_ref(), BranchType::Local)?;
    branch.delete()?;
    Ok(())
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

    let mut branch = self.0.find_branch(&format!("origin/{}", shorthand.as_ref()), BranchType::Remote)?;
    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_has_postfix(&remote)?;
    branch.delete()?;
    remote.push(&[&format!(":refs/heads/{}", shorthand.as_ref())], Some(&mut push_opts))?;
    Ok(())
  }
}
