use std::path::Path;

use crate::creds::ActualCreds;
use crate::creds::Creds;
use crate::error::Result;
use crate::prelude::Add;
use crate::prelude::Repo;
use build::CheckoutBuilder;
use git2::*;

use super::merge::MergeConflictInfo;
use super::merge::MergeResult;

const TAG: &str = "git:stash";

pub trait StashSave {
  fn stash(&mut self, message: Option<&str>) -> Result<Option<Oid>>;
}

pub trait Stash {
  fn stash_apply(&mut self, oid: Oid) -> Result<MergeResult>;
  fn stash_delete(&mut self, oid: Oid) -> Result<()>;
}

impl<C: ActualCreds> StashSave for Repo<'_, C> {
  fn stash(&mut self, message: Option<&str>) -> Result<Option<Oid>> {
    info!(target: TAG, "stashing changes");
    let signature = self.creds().signature()?.to_owned();
    let message = message.unwrap_or("gx-stash");
    let flags = StashFlags::DEFAULT | StashFlags::INCLUDE_UNTRACKED;

    match self.repo_mut().stash_save(&signature, message, Some(flags)) {
      Ok(oid) => {
        info!(target: TAG, "created stash with oid {oid}: {message}");
        Ok(Some(oid))
      }
      Err(e) if e.code() == ErrorCode::NotFound && e.class() == ErrorClass::Stash => {
        info!(target: TAG, "tried to stash but there is nothing to stash");
        Ok(None)
      }
      Err(e) => Err(e.into()),
    }
  }
}

impl<C: Creds> Stash for Repo<'_, C> {
  fn stash_apply(&mut self, oid: Oid) -> Result<MergeResult> {
    info!(target: TAG, "applying stash");

    let stash_index = self.stash_by_oid(oid)?;

    let mut checkout_opts = CheckoutBuilder::default();
    checkout_opts
      .allow_conflicts(true)
      .conflict_style_merge(true)
      .our_label("Updated upstream")
      .their_label("Stashed changes");

    let mut opts = StashApplyOptions::default();
    opts.checkout_options(checkout_opts);

    let mut index = self.repo().index()?;
    let prev_tree = index.write_tree()?;

    self.repo_mut().stash_apply(stash_index, Some(&mut opts))?;

    let index = self.repo().index()?;
    let prev_tree = self.repo().find_tree(prev_tree)?;

    let mut diff_opts = DiffOptions::default();
    diff_opts.context_lines(0).enable_fast_untracked_dirs(true).force_binary(true).ignore_submodules(true);

    let diff = self.repo().diff_tree_to_index(Some(&prev_tree), Some(&index), Some(&mut diff_opts))?;

    let paths = diff.deltas().filter_map(|d| d.new_file().path()).collect::<Vec<&'_ Path>>();

    if index.has_conflicts() {
      let mut conflicts = vec![];
      for conflict in index.conflicts()? {
        conflicts.push(MergeConflictInfo::from(conflict?))
      }

      info!(target: TAG, "stash applied with {} conflicts; oid: {oid}", conflicts.len());
      self.add_glob(paths)?;
      return Ok(MergeResult::Conflicts(conflicts));
    }

    info!(target: TAG, "stash applied w/o conflicts; oid: {oid}; now adding {} files to index", paths.len());
    self.add_glob_force(paths)?;
    Ok(MergeResult::Ok)
  }

  fn stash_delete(&mut self, oid: Oid) -> Result<()> {
    info!(target: TAG, "deleting stash");
    let index = self.stash_by_oid(oid)?;
    self.repo_mut().stash_drop(index)?;
    Ok(())
  }
}

impl<C: Creds> Repo<'_, C> {
  fn stash_by_oid(&mut self, oid: Oid) -> Result<usize> {
    let mut index = 0usize;
    self.repo_mut().stash_foreach(|stash_index, _, stash_oid| {
      if stash_oid.cmp(&oid).is_eq() {
        index = stash_index;
        return false;
      }
      true
    })?;
    Ok(index)
  }
}
