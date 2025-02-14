use std::path::Path;
use std::path::PathBuf;

use git2::*;

use crate::creds::Creds;
use crate::error::Result;
use crate::prelude::*;

const TAG: &str = "git:add";

pub trait Add {
  fn add_all(&self) -> Result<()>;
  fn add<P: AsRef<Path>>(&self, path: P) -> Result<()>;
  fn add_glob<S: IntoCString + AsRef<Path>>(&self, patterns: Vec<S>) -> Result<()>;
  fn add_glob_force<S: IntoCString + AsRef<Path>>(&self, patterns: Vec<S>) -> Result<()>;
}

impl<C: Creds> Add for Repo<C> {
  fn add_all(&self) -> Result<()> {
    self.add_glob(vec!["."])
  }

  fn add<P: AsRef<Path>>(&self, path: P) -> Result<()> {
    self.0.index()?.add_path(path.as_ref())?;
    self.0.index()?.write()?;
    Ok(())
  }

  fn add_glob<S: IntoCString + AsRef<Path>>(&self, patterns: Vec<S>) -> Result<()> {
    use std::collections::HashSet;

    self.ensure_crlf_configured()?;

    let mut index = self.0.index()?;

    let conflicts = index
      .conflicts()?
      .filter_map(|i| i.ok().and_then(|i| i.our))
      .filter_map(|i| String::from_utf8(i.path).ok())
      .map(PathBuf::from)
      .collect::<HashSet<_>>();

    info!(target: TAG, "add {} files; currently {} conflicts in index", patterns.len(), conflicts.len());

    let mut cb = |path: &Path, _: &[u8]| {
      if conflicts.contains(path) {
        warn!(target: TAG, "skipping path '{}' due to conflicts", path.display());
        return 1;
      }

      0
    };

    index.add_all(patterns.into_iter(), IndexAddOption::DEFAULT, Some(&mut cb))?;
    index.write()?;
    Ok(())
  }

  fn add_glob_force<S: IntoCString + AsRef<Path>>(&self, patterns: Vec<S>) -> Result<()> {
    info!(target: TAG, "add files without conflict check: {:?}", patterns.iter().map(|s| s.as_ref().display()).collect::<Vec<_>>());

    let mut index = self.0.index()?;

    index.add_all(patterns.into_iter(), IndexAddOption::DEFAULT, None)?;
    index.write()?;
    Ok(())
  }
}
