use std::ops::Deref;

use git2::*;
use serde::Serialize;

use crate::error::Error;
use crate::error::Result;
use crate::ShortInfo;

pub struct BranchEntry<'b> {
  pub last_commit: Commit<'b>,
  pub branch: Branch<'b>,
  pub kind: BranchType,
}

impl<'b> Deref for BranchEntry<'b> {
  type Target = Branch<'b>;

  fn deref(&self) -> &Self::Target {
    &self.branch
  }
}

impl<'a> From<((Branch<'a>, BranchType), Commit<'a>)> for BranchEntry<'a> {
  fn from(value: ((Branch<'a>, BranchType), Commit<'a>)) -> Self {
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

impl<'b> ShortInfo<'_, BranchInfo> for BranchEntry<'b> {
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
