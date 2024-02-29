use git2::build::CheckoutBuilder;
use git2::build::RepoBuilder;
use git2::*;

use std::borrow::Cow;
use std::path::Path;

use crate::branch::*;
use crate::creds::*;
use crate::remote_callback::ssl_callback;
use crate::ShortInfo;

use crate::error::Error;
use crate::error::Result;
use crate::prelude::StatusInfo;
use crate::remote_callback::make_credentials_callback;

type Repo = git2::Repository;

pub use git2::BranchType;

pub trait Repository<C: Creds>
where
  Self: Sized,
{
  fn repo(&self) -> &Repo;

  fn open<P: AsRef<Path>>(path: P, creds: C) -> Result<Self>;
  fn init<P: AsRef<Path>>(path: P, creds: C) -> Result<Self>;
  fn clone<S: AsRef<str>, P: AsRef<Path>, F: FnMut(usize, usize) -> bool>(
    remote_url: S,
    into: P,
    branch_shorthand: Option<&str>,
    creds: C,
    on_progress: F,
  ) -> Result<Self>;

  fn add_glob<I: Iterator<Item = S>, S: IntoCString>(&self, patterns: I) -> Result<()>;
  fn add<P: AsRef<Path>>(&self, path: P) -> Result<()>;

  fn commit<S: AsRef<str>>(&self, message: S) -> Result<Oid>;
  fn commit_with_parents<S: AsRef<str>>(&self, message: S, parent_branches: Vec<&str>) -> Result<Oid>;
  fn fetch(&self) -> Result<()>;
  fn push(&self) -> Result<()>;
  fn merge<S: AsRef<str>>(&self, theirs_branch: S) -> Result<()>;
  fn conflicts(&self) -> Result<Vec<IndexConflict>>;
  fn diff(&self, a: Oid, b: Oid) -> Result<StatusInfo>;
  fn reset_all(&self, hard: bool, head: Option<Oid>) -> Result<()>;
  fn restore<I: Iterator<Item = P>, P: AsRef<Path>>(&self, paths: I, staged: bool) -> Result<()>;
  fn status(&self) -> Result<Statuses>;

  fn checkout(&self, reference: &str, force: bool) -> Result<()>;

  fn add_remote<S: AsRef<str>, U: AsRef<str>>(&self, name: S, url: U) -> Result<()>;
  fn get_remote(&self) -> Result<Option<String>>;
  fn has_remotes(&self) -> Result<bool>;

  fn branches(&self, branch_type: Option<BranchType>) -> Result<Branches>;
  fn branch_by_name<S: AsRef<str>>(&self, shorthand: S, branch_type: BranchType) -> Result<BranchEntry>;
  fn branch_by_head(&self) -> Result<BranchEntry<'_>>;
  fn new_branch<S: AsRef<str>>(&self, shorthand: S) -> Result<BranchEntry>;
  fn delete_branch<S: AsRef<str>>(&self, shorthand: S, kind: BranchType) -> Result<()>;

  fn stash(&mut self, message: Option<&str>) -> Result<Oid>;
  fn stash_apply(&mut self, oid: Oid) -> Result<()>;
  fn stash_delete(&mut self, oid: Oid) -> Result<()>;
}

pub struct GitRepository<C: Creds>(pub(crate) Repo, pub(crate) C);

impl<C: Creds> Repository<C> for GitRepository<C> {
  fn repo(&self) -> &Repo {
    &self.0
  }

  fn open<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    Ok(Self(Repo::open(path)?, creds))
  }

  fn init<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    let repo = Repo::init(path)?;

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

  fn clone<S: AsRef<str>, P: AsRef<Path>, F: FnMut(usize, usize) -> bool>(
    remote_url: S,
    into: P,
    branch_name: Option<&str>,
    creds: C,
    mut on_progress: F,
  ) -> Result<Self> {
    info!(target: "git", "cloning {} into {}; branch {}", remote_url.as_ref(), into.as_ref().display(), branch_name.unwrap_or("default"));
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
    fetch_opts.remote_callbacks(cbs).update_fetchhead(true).download_tags(AutotagOption::All);

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
    Ok(repo)
  }

  fn add_glob<I: Iterator<Item = S>, S: IntoCString>(&self, patterns: I) -> Result<()> {
    self.0.index()?.add_all(patterns, IndexAddOption::all(), None)?;
    self.0.index()?.write()?;
    Ok(())
  }

  fn add<P: AsRef<Path>>(&self, path: P) -> Result<()> {
    self.0.index()?.add_path(path.as_ref())?;
    self.0.index()?.write()?;
    Ok(())
  }

  fn commit<S: AsRef<str>>(&self, message: S) -> Result<Oid> {
    info!(target: "git", "commit: {}", message.as_ref());
    let signature = self.creds().signature()?;
    let mut index = self.0.index()?;

    let tree = self.0.find_tree(index.write_tree()?)?;
    let parent = self.0.head()?.peel_to_commit()?;

    let oid = self.0.commit(Some("HEAD"), &signature, &signature, message.as_ref(), &tree, &[&parent])?;
    Ok(oid)
  }

  fn commit_with_parents<S: AsRef<str>>(&self, message: S, parents_branches: Vec<&str>) -> Result<Oid> {
    info!(target: "git", "commit: {} (parents {:?})", message.as_ref(), parents_branches);
    let signature = self.creds().signature()?;
    let mut index = self.0.index()?;
    let tree = self.0.find_tree(index.write_tree()?)?;
    let mut commits = Vec::with_capacity(parents_branches.len());
    for shortname in parents_branches {
      let branch = self
        .0
        .find_branch(shortname, BranchType::Local)
        .or_else(|_| self.0.find_branch(shortname, BranchType::Remote))?;
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

  fn fetch(&self) -> Result<()> {
    info!(target: "git", "fetching..");
    let mut cbs = RemoteCallbacks::new();
    let mut opts = FetchOptions::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    opts.remote_callbacks(cbs);
    opts.prune(FetchPrune::On);

    let mut remote = self.0.find_remote("origin")?;
    remote.fetch(&["refs/heads/*:refs/remotes/origin/*"], Some(&mut opts), None)?;
    Ok(())
  }

  fn push(&self) -> Result<()> {
    info!(target: "git", "pushing..");
    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(cbs);

    let head = self.0.head()?;
    let mut remote = self.0.find_remote("origin")?;
    let refspec = head.name().ok_or(Error::Utf8)?;

    remote.push(&[refspec], Some(&mut push_opts))?;
    if let Ok(mut branch) = self.0.find_branch(head.shorthand().ok_or(Error::Utf8)?, BranchType::Local) {
      if branch.upstream().is_err() {
        branch.set_upstream(Some(&format!("origin/{}", branch.name()?.ok_or(Error::Utf8)?)))?;
      }
    }

    Ok(())
  }

  fn conflicts(&self) -> Result<Vec<IndexConflict>> {
    let index = self.0.index()?;
    let mut conflicts = vec![];
    for conflict in index.conflicts()? {
      conflicts.push(conflict?);
    }
    Ok(conflicts)
  }

  fn merge<S: AsRef<str>>(&self, theirs_branch: S) -> Result<()> {
    info!(target: "git", "merging {} into HEAD", theirs_branch.as_ref());
    let theirs = self
      .branch_by_name(theirs_branch.as_ref(), BranchType::Remote)
      .or_else(|_| self.branch_by_name(theirs_branch, BranchType::Local))?;

    let fetch_commit = self.0.find_annotated_commit(theirs.last_commit.id())?;

    match self.0.merge_analysis(&[&fetch_commit])?.0 {
      x if x.is_fast_forward() => self.merge_fastforward(fetch_commit)?,
      x if x.is_normal() => self.normal_merge(
        self.0.head()?.name().ok_or(Error::Utf8)?,
        theirs.branch.name()?.ok_or(Error::Utf8)?,
        &fetch_commit,
      )?,
      _ => info!(target: "git", "skip merge; no actions need"),
    };
    Ok(())
  }

  fn diff(&self, old: Oid, new: Oid) -> Result<StatusInfo> {
    info!(target: "git", "diff {} -> {}", old.to_string(), new.to_string());
    let old_tree = self.0.find_object(old, None).and_then(|o| o.peel_to_tree()).ok();
    let new_tree = self.0.find_object(new, None).and_then(|o| o.peel_to_tree()).ok();

    let mut opts = DiffOptions::new();
    opts.context_lines(0);
    let statuses =
      self.0.diff_tree_to_tree(old_tree.as_ref(), new_tree.as_ref(), Some(&mut opts))?.short_info()?;
    Ok(statuses)
  }

  fn checkout(&self, branch_name: &str, force: bool) -> Result<()> {
    info!(target: "git", "checkout to {} (force: {})", branch_name, force);
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

  fn reset_all(&self, hard: bool, head: Option<Oid>) -> Result<()> {
    info!(target: "git", "reset all to {} (hard: {})", head.map(|h| h.to_string()).as_deref().unwrap_or("HEAD"), hard);
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

  fn restore<I: Iterator<Item = P>, P: AsRef<Path>>(&self, paths: I, staged: bool) -> Result<()> {
    info!(target: "git", "restore");
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

  fn status(&self) -> Result<Statuses> {
    info!(target: "git", "status");
    let mut opts = StatusOptions::default();
    opts
      .include_unmodified(false)
      .include_ignored(false)
      .include_untracked(true)
      .recurse_untracked_dirs(true);
    Ok(self.0.statuses(Some(&mut opts))?)
  }

  fn add_remote<S: AsRef<str>, U: AsRef<str>>(&self, name: S, url: U) -> Result<()> {
    info!(target: "git", "add remote {} with url {}", name.as_ref(), url.as_ref());
    let refspec = &format!("+refs/heads/*:refs/remotes/{}/*", name.as_ref());
    self.0.remote_add_fetch(name.as_ref(), refspec)?;
    self.0.remote_add_push(name.as_ref(), refspec)?;
    self.0.remote_set_url(name.as_ref(), url.as_ref())?;

    let head = self.0.head()?;
    let mut branch = self.0.find_branch(head.shorthand().ok_or(Error::Utf8)?, BranchType::Local)?;
    Ok(branch.set_upstream(Some(head.shorthand().ok_or(Error::Utf8)?))?)
  }

  fn get_remote(&self) -> Result<Option<String>> {
    let remote = self.0.find_remote("origin")?;
    Ok(remote.url().map(|u| u.to_string()))
  }

  fn has_remotes(&self) -> Result<bool> {
    Ok(!self.0.remotes()?.is_empty())
  }

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
    info!(target: "git", "new branch: {}", shorthand.as_ref());
    let commit = self.0.find_commit(self.0.head()?.target().ok_or(Error::Utf8)?)?;
    let branch = (self.0.branch(shorthand.as_ref(), &commit, false)?, BranchType::Local);
    self.0.checkout_tree(branch.0.get().peel_to_tree()?.as_object(), None)?;
    self.0.set_head(branch.0.get().name().ok_or(Error::Utf8)?)?;
    Ok((branch, commit).into())
  }

  fn delete_branch<S: AsRef<str>>(&self, shorthand: S, kind: BranchType) -> Result<()> {
    match kind {
      BranchType::Remote => {
        let mut cbs = RemoteCallbacks::new();
        cbs.credentials(make_credentials_callback(&self.1));
        cbs.certificate_check(ssl_callback);
        let mut push_opts = PushOptions::new();
        push_opts.remote_callbacks(cbs);

        let mut branch = self.0.find_branch(&format!("origin/{}", shorthand.as_ref()), kind)?;
        let mut remote = self.0.find_remote("origin")?;
        branch.delete()?;
        remote.push(&[&format!(":refs/heads/{}", shorthand.as_ref())], Some(&mut push_opts))?;
      }
      BranchType::Local => {
        let mut branch = self.0.find_branch(shorthand.as_ref(), kind)?;
        branch.delete()?;
      }
    };
    Ok(())
  }

  fn stash(&mut self, message: Option<&str>) -> Result<Oid> {
    info!(target: "git", "stash");
    let signature = self.creds().signature()?.to_owned();
    let oid = self.0.stash_save2(
      &signature,
      message,
      Some(StashFlags::DEFAULT | StashFlags::INCLUDE_IGNORED | StashFlags::INCLUDE_UNTRACKED),
    )?;
    Ok(oid)
  }

  fn stash_apply(&mut self, oid: Oid) -> Result<()> {
    info!(target: "git", "apply stash {}", oid.to_string());
    let index = self.stash_by_oid(oid)?;
    let mut checkout_opts = CheckoutBuilder::default();
    checkout_opts.allow_conflicts(true).conflict_style_merge(true);
    let mut opts = StashApplyOptions::default();
    opts.checkout_options(checkout_opts);
    self.0.stash_apply(index, Some(&mut opts))?;

    if self.0.statuses(None)?.iter().any(|s| s.status().is_conflicted()) {
      return Err(
        git2::Error::new(ErrorCode::MergeConflict, ErrorClass::Merge, "Сonflict during applying stash")
          .into(),
      );
    }
    Ok(())
  }

  fn stash_delete(&mut self, oid: Oid) -> Result<()> {
    info!(target: "git", "delete stash: {}", oid.to_string());
    let index = self.stash_by_oid(oid)?;
    self.0.stash_drop(index)?;
    Ok(())
  }
}

impl<C: Creds> GitRepository<C> {
  pub fn resolve_branch_entry<'b>(&'b self, branch: (Branch<'b>, BranchType)) -> Result<BranchEntry<'b>> {
    let commit =
      self.0.resolve_reference_from_short_name(branch.0.name()?.ok_or(Error::Utf8)?)?.peel_to_commit()?;
    Ok((branch, commit).into())
  }

  fn creds(&self) -> &C {
    &self.1
  }

  fn merge_fastforward(&self, fetch_commit: AnnotatedCommit) -> Result<()> {
    info!(target: "git", "merge via fast-forward");
    let mut head = self.0.head()?;
    let msg = format!("Fast-Forward: Setting HEAD to id: {}", fetch_commit.id());
    head.set_target(fetch_commit.id(), &msg)?;
    self.0.set_head(head.name().ok_or(Error::Utf8)?)?;
    self.0.checkout_head(Some(CheckoutBuilder::default().force()))?;
    Ok(())
  }

  fn normal_merge(&self, ours: &str, theirs: &str, remote: &AnnotatedCommit) -> Result<()> {
    info!(target: "git", "merge via normal-merge");
    let local = self.0.reference_to_annotated_commit(&self.0.head()?)?;
    let local_commit = self.0.find_commit(local.id())?;
    let remote_commit = self.0.find_commit(remote.id())?;

    let ancestor = self.0.find_commit(self.0.merge_base(local_commit.id(), remote_commit.id())?)?.tree()?;

    let mut index = self.0.merge_trees(&ancestor, &local_commit.tree()?, &remote_commit.tree()?, None)?;

    if index.has_conflicts() {
      warn!(target: "git", "there is merge conflicts!");
      let mut opts = CheckoutBuilder::new();
      opts.conflict_style_merge(true).allow_conflicts(true);
      self.0.checkout_index(Some(&mut index), Some(&mut opts))?;
    }

    let tree = self.0.find_tree(index.write_tree_to(&self.0)?)?;
    let signature = self.creds().signature()?;
    self.0.commit(
      Some("HEAD"),
      &signature,
      &signature,
      &format!("Merge branch {} into {}", theirs, ours),
      &tree,
      &[&local_commit, &remote_commit],
    )?;

    Ok(())
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
