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

impl<C: Creds> Add for Repo<'_, C> {
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

    info!(target: TAG, "add {} paths; {} conflicts", patterns.len(), conflicts.len());

    let use_add_all = patterns
      .len()
      .eq(&1)
      .then_some(patterns.first().map(|p| p.as_ref().eq(Path::new(".")) || p.as_ref().eq(Path::new("*"))))
      .flatten()
      .unwrap_or(false);

    let is_conflict = |path: &Path| -> bool {
      if conflicts.contains(path) {
        warn!(target: TAG, "skipping path '{}' due to conflicts", path.display());
        return true;
      }
      false
    };

    let mut cb = |path: &Path, _: &[u8]| is_conflict(path) as i32;

    if use_add_all {
      info!(target: TAG, "using add_all since `.` or '*' was provided");
      index.add_all(patterns.into_iter(), IndexAddOption::DEFAULT, Some(&mut cb))?;
      index.write()?;
      return Ok(());
    }

    let workdir_path = self.0.workdir().ok_or(crate::error::Error::NoWorkdir)?;

    let mut del_pathspecs = vec![];
    for path in patterns.iter().filter(|p| !is_conflict(p.as_ref())) {
      let absolute_path = workdir_path.join(path.as_ref());

      if absolute_path.exists() {
        add_all(&mut index, workdir_path, &absolute_path)?;
      } else {
        del_pathspecs.push(path.as_ref());
      }
    }

    if !del_pathspecs.is_empty() {
      index.remove_all(del_pathspecs, None)?;
    }

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

fn add_all(index: &mut Index, workdir_path: &Path, path: &Path) -> Result<()> {
  if !path.is_dir() {
    let Ok(relative_path) = path.strip_prefix(workdir_path) else {
      return Ok(());
    };

    index.add_path(relative_path)?;
    return Ok(());
  }

  for entry in std::fs::read_dir(path)? {
    let path = entry?.path();

    add_all(index, workdir_path, &path)?;
  }

  Ok(())
}
