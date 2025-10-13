use git2::build::CheckoutBuilder;
use git2::*;

use std::borrow::Cow;
use std::path::Path;

use crate::creds::*;
use crate::prelude::BranchEntry;

use crate::error::OrUtf8Err;
use crate::error::Result;

use crate::refmut::RefOrMut;

pub use git2::BranchType;

const TAG: &str = "git";

#[cfg(not(target_family = "wasm"))]
#[inline(always)]
fn set_mwindow_file_limit_once() {
  const FILE_LIMIT: i32 = 8192;

  static SET_OPT: std::sync::Once = std::sync::Once::new();

  SET_OPT.call_once(|| unsafe {
    let result = git2::raw::git_libgit2_opts(git2::raw::GIT_OPT_SET_MWINDOW_FILE_LIMIT as i32, FILE_LIMIT);

    if result != 0 {
      error!("failed to set GIT_OPT_SET_MWINDOW_FILE_LIMIT to {FILE_LIMIT}; result code {result}");
    }
  });
}

pub struct Repo<'r, C: Creds>(pub(crate) RefOrMut<'r, git2::Repository>, pub(crate) C);

impl<'r, C: Creds> Repo<'r, C> {
  pub fn repo(&self) -> &git2::Repository {
    self.0.as_ref()
  }

  pub fn repo_mut(&mut self) -> &mut git2::Repository {
    self.0.as_mut().expect("repo is not mutable")
  }

  pub fn open<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    #[cfg(not(target_family = "wasm"))]
    set_mwindow_file_limit_once();

    let repo = git2::Repository::open(path)?;

    #[cfg(target_family = "wasm")]
    if repo.config()?.get_bool("core.fileMode")? {
      repo.config()?.set_bool("core.fileMode", false)?;
    }

    Ok(Self(RefOrMut::Owned(repo), creds))
  }

  pub fn reopen(&mut self) -> Result<()> {
    *self = Self::open(self.0.path(), self.1.clone())?;
    Ok(())
  }

  pub fn init<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    let repo = git2::Repository::init(path)?;

    {
      let mut index = repo.index()?;
      let signature = creds.signature()?;
      index.add_all(["."], IndexAddOption::DEFAULT, None)?;
      index.write()?;
      let oid = index.write_tree()?;
      if let Ok(parent) = repo.head().and_then(|head| head.peel_to_commit()) {
        repo.commit(Some("HEAD"), &signature, &signature, "init", &repo.find_tree(oid)?, &[&parent])?;
      } else {
        repo.commit(Some("HEAD"), &signature, &signature, "init", &repo.find_tree(oid)?, &[])?;
      }
    }

    let repo = Self(RefOrMut::Owned(repo), creds);
    repo.ensure_objects_dir_exists()?;
    repo.ensure_trash_ignored()?;

    Ok(repo)
  }

  pub fn set_head(&self, refname: &str) -> Result<()> {
    let refname = if refname.starts_with("refs/heads/") {
      Cow::Borrowed(refname)
    } else {
      Cow::Owned(format!("refs/heads/{refname}"))
    };

    if !self.0.find_reference(&refname)?.is_branch() {
      let error = git2::Error::new(
        git2::ErrorCode::Invalid,
        git2::ErrorClass::Reference,
        "Switch head to non-branch is not allowed",
      );

      return Err(error.into());
    }

    self.0.set_head(&refname)?;
    Ok(())
  }

  pub fn checkout(&self, branch_name: &str, force: bool) -> Result<()> {
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

    self.0.checkout_tree(branch.get().peel_to_tree()?.as_object(), Some(&mut opts))?;
    self.0.set_head(branch.get().name().or_utf8_err()?)?;
    Ok(())
  }
}

impl<C: Creds> Repo<'_, C> {
  pub fn resolve_branch_entry<'b>(
    &'b self,
    branch: (git2::Branch<'b>, BranchType),
  ) -> Result<BranchEntry<'b>> {
    let refname = branch.0.name()?.or_utf8_err()?;
    let commit = self.0.resolve_reference_from_short_name(refname)?.peel_to_commit()?;
    Ok((branch, commit).into())
  }

  pub(crate) fn creds(&self) -> &C {
    &self.1
  }

  pub(crate) fn ensure_head_exists(&self) -> Result<()> {
    let Err(err) = self.0.head() else { return Ok(()) };

    if !(err.code() == ErrorCode::UnbornBranch && err.class() == ErrorClass::Reference) {
      return Err(err.into());
    }

    match self.1.signature() {
      Ok(sig) => {
        let tree = self.0.treebuilder(None)?.write()?;
        self.0.commit(Some("HEAD"), &sig, &sig, "init", &self.0.find_tree(tree)?, &[])?;
      }
      Err(err) => {
        error!(target: TAG, "failed to get signature: {err}; skip creating head");
      }
    }

    Ok(())
  }

  pub(crate) fn ensure_trash_ignored(&self) -> Result<()> {
    #[cfg(target_os = "macos")]
    {
      use std::fs::File;
      use std::io::Read;
      use std::io::Write;

      const TRASH: [&str; 1] = ["**/.DS_Store"];

      let exclude_file_path = self.0.path().join("info/exclude");
      std::fs::create_dir_all(exclude_file_path.parent().unwrap())?;
      let mut file = File::options().append(true).read(true).create(true).open(&exclude_file_path)?;
      let mut exclude = String::new();
      file.read_to_string(&mut exclude)?;

      let mut append_exclude = String::new();

      for pattern in TRASH {
        if !exclude.lines().any(|line| line == pattern) {
          append_exclude.push('\n');
          append_exclude.push_str(pattern);
        }
      }

      if !append_exclude.is_empty() {
        append_exclude.push('\n');
        info!(target: TAG, "found useless files {TRASH:?}; writing to .git/info/exclude:\n{append_exclude}");
        file.write_all(append_exclude.as_bytes())?;
      }
    }

    Ok(())
  }

  pub(crate) fn ensure_crlf_configured(&self) -> Result<()> {
    let mut config = self.0.config()?.open_level(ConfigLevel::Local)?;

    if !config.get_entry("core.autocrlf").map(|v| v.has_value()).unwrap_or_default() {
      config.set_str("core.autocrlf", "input")?;
    }

    if !config.get_entry("core.safecrlf").map(|v| v.has_value()).unwrap_or_default() {
      config.set_bool("core.safecrlf", false)?;
    }

    Ok(())
  }

  pub(crate) fn ensure_remote_has_postfix(&self, remote: &'_ Remote) -> Result<()> {
    let Some(url) = remote.url() else { return Ok(()) };
    let Some(name) = remote.name() else { return Ok(()) };

    if url.ends_with(".git") || url.ends_with(".git/") || !url.starts_with("http") {
      return Ok(());
    }

    info!(target: TAG, "setting remote {name} url to {url}");

    let url = format!("{}.git", url.trim_end_matches('/'));
    self.0.remote_set_pushurl(name, Some(url.as_str()))?;
    self.0.remote_set_url(name, url.as_str())?;

    Ok(())
  }

  pub(crate) fn ensure_objects_dir_exists(&self) -> Result<()> {
    let objects_dir = self.0.path().join("objects");
    std::fs::create_dir_all(objects_dir.join("pack"))?;
    std::fs::create_dir_all(objects_dir.join("info"))?;
    Ok(())
  }
}
