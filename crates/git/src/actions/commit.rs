use std::path::PathBuf;

use git2::*;

use crate::creds::*;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::prelude::Status;
use crate::repo::Repo;

const TAG: &str = "git:commit";

#[derive(serde::Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitOptions {
  pub message: String,
  pub parent_refs: Option<Vec<String>>,
  pub files: Option<Vec<PathBuf>>,
}

pub trait Commits<C: ActualCreds> {
  fn commit(&self, opts: CommitOptions) -> Result<Oid>;
  fn commit_debug(&self) -> Result<(Oid, String)>;
}

impl<C: ActualCreds> Commits<C> for Repo<'_, C> {
  fn commit(&self, opts: CommitOptions) -> Result<Oid> {
    info!(
      target: TAG,
      "commit {} ({}): {:?}",
      if let Some(ref parent_refs) = opts.parent_refs { parent_refs.join(", ") } else { "on HEAD".to_string() },
      opts.files.as_ref().map(|f| format!("{} files", f.len())).unwrap_or("whole index".to_string()),
      opts.message
    );

    let signature = self.creds().signature()?;

    let tree = self.index_create_tree(opts.files)?;
    let parents = self.parent_branches_to_commits(opts.parent_refs)?;
    let parents = parents.iter().collect::<Vec<_>>();

    let oid = self.0.commit(Some("HEAD"), &signature, &signature, opts.message.as_str(), &tree, &parents)?;

    Ok(oid)
  }

  fn commit_debug(&self) -> Result<(Oid, String)> {
    use std::sync::atomic::AtomicUsize;
    use std::sync::atomic::Ordering;

    use crate::prelude::Branch;

    static COUNTER: AtomicUsize = AtomicUsize::new(0);

    let counter = COUNTER.fetch_add(1, Ordering::Relaxed);
    let branch = self.branch_by_head()?;
    let branch = branch.name()?.or_utf8_err()?;

    let message = format!("debug commit on {branch}: {counter}");
    let oid = self.commit(CommitOptions { message: message.clone(), parent_refs: None, files: None })?;

    Ok((oid, message))
  }
}

impl<C: Creds> Repo<'_, C> {
  fn index_create_tree(&self, files: Option<Vec<PathBuf>>) -> Result<Tree> {
    let mut index = self.0.index()?;

    let Some(files) = files else {
      info!(target: TAG, "using index that already present");
      index.add_all(["."].iter(), IndexAddOption::DEFAULT, None)?;
      index.write()?;
      return Ok(self.0.find_tree(index.write_tree()?)?);
    };

    match self.0.head()?.peel_to_tree() {
      Ok(head_tree) => {
        let statuses = self.status(true)?;
        let is_whole_index = statuses.len() == files.len();

        let paths = statuses.iter().filter_map(|s| s.path().map(|s| s.to_string())).collect::<Vec<_>>();

        info!(target: TAG, "reset index & add specified files: {files:?}");
        index.read_tree(&head_tree)?;
        index.add_all(files.iter(), IndexAddOption::DEFAULT, None)?;
        let tree = self.0.find_tree(index.write_tree_to(&self.0)?)?;

        if !is_whole_index {
          info!(target: TAG, "add all previous files back");
          index.add_all(paths, IndexAddOption::DEFAULT, None)?;
          index.write()?;
        }

        Ok(tree)
      }
      Err(_) => {
        warn!(target: TAG, "HEAD has no commit; cannot reset index, so using the index that already present");
        Ok(self.0.find_tree(index.write_tree_to(&self.0)?)?)
      }
    }
  }

  fn parent_branches_to_commits(&self, shortnames: Option<Vec<String>>) -> Result<Vec<git2::Commit>> {
    let mut commits = Vec::with_capacity(shortnames.as_ref().map_or(1, |shortnames| shortnames.len()));

    let Some(shortnames) = shortnames else {
      return Ok(vec![self.0.head()?.peel_to_commit()?]);
    };

    for shortname in shortnames {
      let branch = self
        .0
        .find_branch(&shortname, BranchType::Local)
        .or_else(|_| self.0.find_branch(&shortname, BranchType::Remote))?;

      commits.push(branch.get().peel_to_commit()?);
    }
    Ok(commits)
  }
}
