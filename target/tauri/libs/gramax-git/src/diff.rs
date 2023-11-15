use git2::*;

use serde::Serialize;

use crate::error::Error;
use crate::Result;

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FileDiff {
  author_name: String,
  author_email: String,
  commit_oid: String,
  date: i64,
  content: Option<String>,
  parent_content: Option<String>,
  pub has_changes: bool,
}

impl FileDiff {
  pub fn from_blobs(
    repo: &Repository,
    commit: &Commit,
    lhs: Option<&Blob>,
    rhs: Option<&Blob>,
    opts: Option<&mut DiffOptions>,
  ) -> Result<Self> {
    let signature = commit.author();
    let mut has_changes = false;
    repo.diff_blobs(
      rhs,
      None,
      lhs,
      None,
      opts,
      Some(&mut |_, _| {
        has_changes = true;
        true
      }),
      None,
      None,
      None,
    )?;

    let rhs = rhs.map(|blob| String::from_utf8_lossy(blob.content()).to_string());
    let lhs = lhs.map(|blob| String::from_utf8_lossy(blob.content()).to_string());
    let diff = FileDiff {
      author_name: signature.name().ok_or(Error::Utf8)?.into(),
      author_email: signature.email().ok_or(Error::Utf8)?.into(),
      commit_oid: commit.id().to_string(),
      date: commit.time().seconds() * 1000,
      content: rhs,
      parent_content: lhs,
      has_changes,
    };

    Ok(diff)
  }
}
