use crate::creds::ActualCreds;
use crate::creds::Creds;
use crate::error::Result;
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

impl<C: ActualCreds> StashSave for Repo<C> {
  fn stash(&mut self, message: Option<&str>) -> Result<Option<Oid>> {
    info!(target: TAG, "creating stash with message {:?}", message);
    let signature = self.creds().signature()?.to_owned();
    match self.0.stash_save2(
      &signature,
      message,
      Some(StashFlags::DEFAULT | StashFlags::INCLUDE_IGNORED | StashFlags::INCLUDE_UNTRACKED),
    ) {
      Ok(oid) => {
        info!(target: TAG, "created stash with oid {}", oid);
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

impl<C: Creds> Stash for Repo<C> {
  fn stash_apply(&mut self, oid: Oid) -> Result<MergeResult> {
    info!(target: TAG, "applying stash with oid {}", oid);

    let stash = self.0.find_commit(oid)?;
    let head = self.0.head()?.peel_to_commit()?;
    let ancestor = self.0.find_commit(self.0.merge_base(stash.id(), head.id())?)?;

    let mut opts = MergeOptions::new();
    opts.find_renames(true);

    let mut index = self.0.merge_trees(&ancestor.tree()?, &head.tree()?, &stash.tree()?, Some(&opts))?;
    let mut opts = CheckoutBuilder::default();
    opts
      .allow_conflicts(true)
      .conflict_style_merge(true)
      .our_label("Updated upstream")
      .their_label("Stashed changes");
    if index.has_conflicts() {
      let mut conflicts = vec![];
      for conflict in index.conflicts()? {
        conflicts.push(MergeConflictInfo::from(conflict?))
      }

      self.0.checkout_index(Some(&mut index), Some(&mut opts))?;
      info!(target: TAG, "stash {} applied with {} conflicts", oid, conflicts.len());
      return Ok(MergeResult::Conflicts(conflicts));
    }

    self.0.checkout_index(Some(&mut index), Some(&mut opts))?;
    info!(target: TAG, "stash {} applied without conflicts", oid);
    Ok(MergeResult::Ok)
  }

  fn stash_delete(&mut self, oid: Oid) -> Result<()> {
    info!(target: "git", "delete stash: {}", oid.to_string());
    let index = self.stash_by_oid(oid)?;
    self.0.stash_drop(index)?;
    Ok(())
  }
}

impl<C: Creds> Repo<C> {
  fn stash_by_oid(&mut self, oid: Oid) -> Result<usize> {
    let mut index = 0usize;
    self.0.stash_foreach(|stash_index, _, stash_oid| {
      if stash_oid.cmp(&oid).is_eq() {
        index = stash_index;
        return false;
      }
      true
    })?;
    Ok(index)
  }
}
