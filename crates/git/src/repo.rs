use git2::build::CheckoutBuilder;
use git2::*;

use std::borrow::Cow;
use std::path::Path;

use crate::creds::*;
use crate::prelude::Branch;
use crate::prelude::BranchEntry;
use crate::remote_callback::push_update_reference_callback;
use crate::remote_callback::ssl_callback;

use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::remote_callback::make_credentials_callback;
use crate::remote_callback::AddCredentialsHeaders;

pub use git2::BranchType;

const TAG: &str = "git";

#[cfg(not(target_family = "wasm"))]
#[inline(always)]
fn set_mwindow_file_limit_once() {
  const FILE_LIMIT: i32 = 8192;

  static SET_OPT: std::sync::Once = std::sync::Once::new();

  SET_OPT.call_once(|| unsafe {
    let result = git2::raw::git_libgit2_opts(git2::raw::GIT_OPT_SET_MWINDOW_FILE_LIMIT as i32, FILE_LIMIT);

    if result == 0 {
      info!("set GIT_OPT_SET_MWINDOW_FILE_LIMIT to {}; result code {}", FILE_LIMIT, result);
    } else {
      error!("failed to set GIT_OPT_SET_MWINDOW_FILE_LIMIT to {}; result code {}", FILE_LIMIT, result);
    }
  });
}

pub struct Repo<C: Creds>(pub(crate) git2::Repository, pub(crate) C);

impl<C: Creds> Repo<C> {
  pub fn repo(&self) -> &git2::Repository {
    &self.0
  }

  pub fn open<P: AsRef<Path>>(path: P, creds: C) -> Result<Self> {
    #[cfg(not(target_family = "wasm"))]
    set_mwindow_file_limit_once();

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
      index.add_all(["."], IndexAddOption::DEFAULT, None)?;
      index.write()?;
      let oid = index.write_tree()?;
      if let Ok(parent) = repo.head().and_then(|head| head.peel_to_commit()) {
        repo.commit(Some("HEAD"), &signature, &signature, "init", &repo.find_tree(oid)?, &[&parent])?;
      } else {
        repo.commit(Some("HEAD"), &signature, &signature, "init", &repo.find_tree(oid)?, &[])?;
      }
    }

    let repo = Self(repo, creds);
    repo.ensure_trash_ignored()?;

    Ok(repo)
  }

  pub fn fetch(&self, force: bool) -> Result<()> {
    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    cbs.push_update_reference(push_update_reference_callback);

    let mut opts = FetchOptions::new();
    opts.remote_callbacks(cbs);
    opts.add_credentials_headers(&self.1);
    opts.follow_redirects(RemoteRedirect::All);
    opts.prune(FetchPrune::On);
    opts.download_tags(AutotagOption::All);

    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_has_postfix(&remote)?;

    let refspec = match force {
      true => ["+refs/*:refs/*"],
      false => ["refs/heads/*:refs/remotes/origin/*"],
    };

    info!(target: TAG, "fetching at {}{}; refspecs: {:?}", self.0.path().display(), if force { " (force)" } else { "" }, refspec);

    remote.fetch(&refspec, Some(&mut opts), None)?;
    Ok(())
  }

  pub fn push(&self) -> Result<()> {
    let mut cbs = RemoteCallbacks::new();
    cbs.credentials(make_credentials_callback(&self.1));
    cbs.certificate_check(ssl_callback);
    cbs.push_update_reference(push_update_reference_callback);

    let mut push_opts = PushOptions::new();
    push_opts.remote_callbacks(cbs);
    push_opts.follow_redirects(RemoteRedirect::All);
    push_opts.add_credentials_headers(&self.1);
    push_opts.follow_redirects(RemoteRedirect::All);

    let head = self.0.head()?;
    let mut remote = self.0.find_remote("origin")?;
    self.ensure_remote_has_postfix(&remote)?;
    let should_set_upstream = self.ensure_branch_has_upstream(head.shorthand().or_utf8_err()?)?;
    let refspec = head.name().or_utf8_err()?;

    info!(target: TAG, "pushing refspec {}", refspec);

    remote.push(&[refspec], Some(&mut push_opts))?;

    if should_set_upstream {
      self.ensure_branch_has_upstream(head.shorthand().or_utf8_err()?)?;
    }

    Ok(())
  }

  pub fn set_head(&self, refname: &str) -> Result<()> {
    let refname = if refname.starts_with("refs/heads/") {
      Cow::Borrowed(refname)
    } else {
      Cow::Owned(format!("refs/heads/{}", refname))
    };

    if !self.0.find_reference(&refname)?.is_branch() {
      return Err(
        git2::Error::new(
          git2::ErrorCode::Invalid,
          git2::ErrorClass::Reference,
          "Switch head to non-branch is not allowed",
        )
        .into(),
      );
    }

    self.0.set_head(&refname)?;
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
    self.0.set_head(branch.get().name().or_utf8_err()?)?;
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
    info!(target: TAG, "restore{}", if staged { " staged" } else { "" });

    let mut index = self.0.index()?;
    let tree = self.0.head()?.peel_to_tree()?;
    let workdir = self.0.workdir().unwrap_or_else(|| self.0.path());
    for path in paths {
      if staged {
        match tree.get_path(path.as_ref()) {
          Ok(entry) => {
            let index_entry = IndexEntry {
              id: entry.id(),
              path: path.as_ref().as_os_str().as_encoded_bytes().to_vec(),
              mode: entry.filemode() as u32,
              ctime: git2::IndexTime::new(0, 0),
              mtime: git2::IndexTime::new(0, 0),
              dev: 0,
              ino: 0,
              uid: 0,
              gid: 0,
              file_size: 0,
              flags: 0,
              flags_extended: 0,
            };

            index.add(&index_entry)?;
          }
          Err(_) => {
            if let Err(err) = index.remove_path(path.as_ref()) {
              warn!(target: TAG, "failed to remove path {}: {}", path.as_ref().display(), err);
            }
          }
        }

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
        Err(err) if matches!((err.class(), err.code()), (ErrorClass::Tree, ErrorCode::NotFound)) => {
          self.remove_path(&fs_path)?;
        }
        Err(err) => return Err(err.into()),
      }
    }

    index.write()?;

    Ok(())
  }
}

impl<C: Creds> Repo<C> {
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

  fn remove_path(&self, path: &Path) -> Result<()> {
    if !path.exists() {
      warn!(target: TAG, "path {} does not exist", path.display());
      return Ok(());
    }

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

    match self.1.signature() {
      Ok(sig) => {
        let tree = self.0.treebuilder(None)?.write()?;
        self.0.commit(Some("HEAD"), &sig, &sig, "init", &self.0.find_tree(tree)?, &[])?;
      }
      Err(err) => {
        error!(target: TAG, "failed to get signature: {}; skip creating head", err);
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
        info!(target: TAG, "found useless files {:?}; writing to .git/info/exclude:\n{}", TRASH, append_exclude);
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

    let url = format!("{}.git", url.trim_end_matches('/'));
    self.0.remote_set_pushurl(name, Some(url.as_str()))?;
    self.0.remote_set_url(name, url.as_str())?;

    Ok(())
  }
}
