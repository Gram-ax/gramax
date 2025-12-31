use crate::creds::ActualCreds;
use crate::error::OrUtf8Err;
use crate::ext::lfs::Lfs;
use crate::repo::Repo;
use crate::Result;

use git2::build::CheckoutBuilder;
use git2::*;

pub trait Checkout {
  fn checkout(&self, branch_name: &str, force: bool) -> Result<()>;
}

const TAG: &str = "git:checkout";

impl<C: ActualCreds> Checkout for Repo<'_, C> {
  fn checkout(&self, branch_name: &str, force: bool) -> Result<()> {
    info!(target: TAG, "performing checkout");

    let branch = match self.0.find_branch(branch_name, BranchType::Local) {
      Ok(b) => b,
      Err(err) if err.code() == ErrorCode::NotFound && err.class() == ErrorClass::Reference => {
        let remote_ref = self.0.find_reference(&format!("refs/remotes/origin/{branch_name}"))?;
        let mut branch = self.0.branch(branch_name, &remote_ref.peel_to_commit()?, false)?;
        branch.set_upstream(Some(&format!("origin/{branch_name}")))?;
        branch
      }
      Err(err) => return Err(err.into()),
    };

    let mut opts = CheckoutBuilder::new();
    if force {
      opts.force();
    }

    let tree = branch.get().peel_to_tree()?;

    self.pull_missing_lfs_objects(&tree, crate::cancel_token::CancelToken::NeverCancel)?;
    info!("pulled lfs objects");

    self.0.checkout_tree(tree.as_object(), Some(&mut opts))?;
    self.0.set_head(branch.get().name().or_utf8_err()?)?;

    Ok(())
  }
}
