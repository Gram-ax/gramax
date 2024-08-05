use git2::build::CheckoutBuilder;
use git2::build::RepoBuilder;
use git2::*;

use std::path::Path;

use crate::actions::branch::*;

use crate::creds::*;
use crate::remote_callback::ssl_callback;

use crate::error::Error;
use crate::error::Result;
use crate::remote_callback::make_credentials_callback;

pub use git2::BranchType;

const TAG: &str = "git";

pub struct Repo<C: Creds>(pub(crate) git2::Repository, pub(crate) C);

impl<C: Creds> Repo<C> {
  pub fn repo(&self) -> &git2::Repository {
    &self.0
  }

  pub fn open<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    let repo = git2::Repository::open(path)?;

    #[cfg(target_family = "wasm")]
    if repo.config()?.get_bool("core.fileMode")? {
      repo.config()?.set_bool("core.fileMode", false)?;
    }

    Ok(Self(repo, creds))
  }

  pub fn init<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    let repo = git2::Repository::init(path)?;

    {
      let mut index = repo.index()?;
      let signature = creds.signature()?;
      index.add_all(["."], IndexAddOption::all(), None)?;
      index.write()?;
      let oid = index.write_tree()?;
      if let Ok(parent) = repo.head().and_then(|head| head.peel_to_commit()) {
        repo.commit(Some("HEAD"), &signature, &signature, "init", &repo.find_tree(oid)?, &[&parent])?;
      } else {
        repo.commit(Some("HEAD"), &signature, &signature, "init", &repo.find_tree(oid)?, &[])?;
      }
    }

    Ok(Self(repo, creds))
  }

  pub fn clone<S: AsRef<str>, P: AsRef<Path>, F: FnMut(usize, usize) -> bool>(
    remote_url: S,
    into: P,
    branch_name: Option<&str>,
    creds: C,
    mut on_progress: F,
  ) -> Result<Self> {
    info!(
      target: TAG,
      "cloning {} into {}; branch {}",
      remote_url.as_ref(),
      into.as_ref().display(),
      branch_name.unwrap_or("default")
    );
    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&creds));
    cbs.certificate_check(ssl_callback);
    cbs.transfer_progress(|progress| {
      on_progress(
        progress.received_objects()
          + progress.indexed_deltas()
          + progress.indexed_objects()
          + progress.local_objects(),
        progress.total_objects() + progress.total_objects() / 3,
      )
    });

    let mut fetch_opts = FetchOptions::new();
    fetch_opts.remote_callbacks(cbs).download_tags(AutotagOption::None);
    let mut checkout_opts = CheckoutBuilder::new();
    checkout_opts.force();

    let repo = {
      let mut builder = RepoBuilder::new();
      builder.fetch_options(fetch_opts).with_checkout(checkout_opts);
      if let Some(branch) = branch_name {
        builder.branch(branch);
      }
      builder.clone(remote_url.as_ref(), into.as_ref())?
    };

    let repo = Self(repo, creds);
    repo.ensure_head_exists()?;
    Ok(repo)
  }

  pub fn add_glob<I: Iterator<Item = S>, S: IntoCString>(&self, patterns: I) -> Result<()> {
    self.0.index()?.add_all(patterns, IndexAddOption::all(), None)?;
    self.0.index()?.write()?;
    Ok(())
  }

  pub fn add<P: AsRef<Path>>(&self, path: P) -> Result<()> {
    self.0.index()?.add_path(path.as_ref())?;
    self.0.index()?.write()?;
    Ok(())
  }

  pub fn commit<S: AsRef<str>>(&self, message: S) -> Result<Oid> {
    info!(target: TAG, "commit: {}", message.as_ref());
    let signature = self.creds().signature()?;
    let mut index = self.0.index()?;

    let tree = self.0.find_tree(index.write_tree()?)?;
    let parent = self.0.head()?.peel_to_commit()?;

    let oid = self.0.commit(Some("HEAD"), &signature, &signature, message.as_ref(), &tree, &[&parent])?;
    Ok(oid)
  }

  pub fn commit_with_parents<S: AsRef<str>>(&self, message: S, parents_branches: Vec<String>) -> Result<Oid> {
    info!(target: TAG, "commit: {} (parents {:?})", message.as_ref(), parents_branches);
    let signature = self.creds().signature()?;
    let mut index = self.0.index()?;
    let tree = self.0.find_tree(index.write_tree()?)?;
    let mut commits = Vec::with_capacity(parents_branches.len());
    for shortname in parents_branches {
      let branch = self
        .0
        .find_branch(&shortname, BranchType::Local)
        .or_else(|_| self.0.find_branch(&shortname, BranchType::Remote))?;
      commits.push(branch.get().peel_to_commit()?);
    }

    let oid = self.0.commit(
      Some("HEAD"),
      &signature,
      &signature,
      message.as_ref(),
      &tree,
      &commits.iter().collect::<Vec<_>>(),
    )?;
    Ok(oid)
  }

  pub fn fetch(&self) -> Result<()> {
    info!(target: TAG, "fetching..");
    let mut cbs = RemoteCallbacks::new();
    let mut opts = FetchOptions::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    opts.remote_callbacks(cbs);
    opts.prune(FetchPrune::On);

    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_has_postfix(&remote)?;
    remote.fetch(&["refs/heads/*:refs/remotes/origin/*"], Some(&mut opts), None)?;
    Ok(())
  }

  pub fn push(&self) -> Result<()> {
    info!(target: TAG, "pushing..");
    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(cbs);

    let head = self.0.head()?;
    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_has_postfix(&remote)?;
    let refspec = head.name().ok_or(Error::Utf8)?;

    remote.push(&[refspec], Some(&mut push_opts))?;
    if let Ok(mut branch) = self.0.find_branch(head.shorthand().ok_or(Error::Utf8)?, BranchType::Local) {
      if branch.upstream().is_err() {
        branch.set_upstream(Some(&format!("origin/{}", branch.name()?.ok_or(Error::Utf8)?)))?;
      }
    }

    Ok(())
  }

  pub fn checkout(&self, branch_name: &str, force: bool) -> Result<()> {
    info!(target: TAG, "checkout to {} (force: {})", branch_name, force);
    let branch = match self.0.find_branch(branch_name, BranchType::Local) {
      Ok(b) => b,
      Err(err) if err.code() == ErrorCode::NotFound && err.class() == ErrorClass::Reference => {
        let remote_ref = self.0.find_reference(&format!("refs/remotes/origin/{}", branch_name))?;
        let mut branch = self.0.branch(branch_name, &remote_ref.peel_to_commit()?, false)?;
        branch.set_upstream(Some(&format!("origin/{}", branch_name)))?;
        branch
      }
      Err(err) => return Err(err.into()),
    };

    let mut opts = CheckoutBuilder::new();
    if force {
      opts.force();
    }

    self.0.checkout_tree(branch.get().peel_to_tree()?.as_object(), Some(&mut opts))?;
    self.0.set_head(branch.get().name().ok_or(Error::Utf8)?)?;
    Ok(())
  }

  pub fn reset_all(&self, hard: bool, head: Option<Oid>) -> Result<()> {
    info!(target: TAG, "reset all to {} (hard: {})", head.map(|h| h.to_string()).as_deref().unwrap_or("HEAD"), hard);

    let commit = match head {
      Some(head) => self.0.find_commit(head)?,
      None => self.0.head()?.peel_to_commit()?.parent(0)?,
    };

    if hard {
      let mut opts = CheckoutBuilder::new();
      opts.remove_ignored(true).remove_untracked(true);
      self.0.reset(commit.as_object(), ResetType::Hard, Some(&mut opts))?;
    } else {
      self.0.reset(commit.as_object(), ResetType::Soft, None)?;
    }

    Ok(())
  }

  pub fn restore<I: Iterator<Item = P>, P: AsRef<Path>>(&self, paths: I, staged: bool) -> Result<()> {
    info!(target: TAG, "restore");
    let mut index = self.0.index()?;
    let tree = self.0.head()?.peel_to_tree()?;
    let workdir = self.0.workdir().unwrap_or_else(|| self.0.path());
    for path in paths {
      if staged {
        _ = index.remove_path(path.as_ref());
        continue;
      }

      let fs_path = workdir.join(path.as_ref());
      match tree.get_path(path.as_ref()) {
        Ok(entry) => {
          let blob = entry.to_object(&self.0)?.peel_to_blob()?;
          if !fs_path.parent().map(|p| p.exists()).unwrap_or(true) {
            std::fs::create_dir_all(fs_path.parent().unwrap())?;
          }
          std::fs::write(fs_path, blob.content())?;
        }
        Err(err)
          if err.code() == ErrorCode::NotFound && err.class() == ErrorClass::Tree && fs_path.exists() =>
        {
          self.remove_path(&fs_path)?;
        }
        Err(err) => return Err(err.into()),
      }
    }
    index.write()?;
    self.add_glob(["."].iter())?;
    Ok(())
  }
}

impl<C: Creds> Repo<C> {
  pub fn resolve_branch_entry<'b>(
    &'b self,
    branch: (git2::Branch<'b>, BranchType),
  ) -> Result<BranchEntry<'b>> {
    let commit =
      self.0.resolve_reference_from_short_name(branch.0.name()?.ok_or(Error::Utf8)?)?.peel_to_commit()?;
    Ok((branch, commit).into())
  }

  pub(crate) fn creds(&self) -> &C {
    &self.1
  }

  fn remove_path(&self, path: &Path) -> Result<()> {
    if std::fs::metadata(path)?.is_dir() {
      std::fs::remove_dir_all(path)?;
      return Ok(());
    }

    std::fs::remove_file(path)?;
    if let Some(parent) = path.parent() {
      if std::fs::metadata(parent)?.is_dir() && parent.read_dir()?.next().is_none() {
        std::fs::remove_dir_all(parent)?;
      }
    }
    Ok(())
  }

  pub(crate) fn ensure_head_exists(&self) -> Result<()> {
    let Err(err) = self.0.head() else { return Ok(()) };

    if !(err.code() == ErrorCode::UnbornBranch && err.class() == ErrorClass::Reference) {
      return Err(err.into());
    }

    let sig = self.1.signature()?;
    let tree = self.0.treebuilder(None)?.write()?;
    self.0.commit(Some("HEAD"), &sig, &sig, "init", &self.0.find_tree(tree)?, &[])?;

    Ok(())
  }

  pub(crate) fn ensure_remote_has_postfix(&self, remote: &'_ Remote) -> Result<()> {
    let Some(url) = remote.url() else { return Ok(()) };
    let Some(name) = remote.name() else { return Ok(()) };

    if url.ends_with(".git") || url.ends_with(".git/") || !url.starts_with("http") {
      return Ok(());
    }

    let url = format!("{}.git", url.trim_end_matches('/'));
    self.0.remote_set_pushurl(name, Some(url.as_str()))?;
    self.0.remote_set_url(name, url.as_str())?;

    Ok(())
  }
}
