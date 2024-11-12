use std::borrow::Cow;
use std::path::Path;

use serde::Serialize;

use git2::*;

use crate::creds::Creds;
use crate::prelude::*;
use crate::Result;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
  pub name: String,
  pub is_dir: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Stat {
  pub size: usize,
  pub is_dir: bool,
  pub is_binary: bool,
}

pub trait RepoSelectTreeScope<C: Creds> {
  fn read_tree_head(&self) -> Result<RepoTreeScope<C>>;
  fn read_tree_commit(&self, oid: Oid) -> Result<RepoTreeScope<C>>;
  fn read_tree_reference(&self, reference: &str) -> Result<RepoTreeScope<C>>;
}

pub trait ReadTree {
  fn exists<P: AsRef<Path>>(&self, path: P) -> Result<bool>;
  fn stat<P: AsRef<Path>>(&self, path: P) -> Result<Stat>;
  fn read_dir<P: AsRef<Path>>(&self, path: P) -> Result<Vec<DirEntry>>;
  fn read_to_vec<P: AsRef<Path>>(&self, path: P) -> Result<Vec<u8>>;
  fn read_to_string<P: AsRef<Path>>(&self, path: P) -> Result<String>;
}

pub struct RepoTreeScope<'t, C: Creds> {
  repo: &'t Repo<C>,
  tree: Tree<'t>,
}

impl<C: Creds> RepoSelectTreeScope<C> for Repo<C> {
  fn read_tree_head(&self) -> Result<RepoTreeScope<C>> {
    Ok(RepoTreeScope { repo: self, tree: self.0.head()?.peel_to_tree()? })
  }

  fn read_tree_commit(&self, oid: Oid) -> Result<RepoTreeScope<C>> {
    Ok(RepoTreeScope { repo: self, tree: self.0.find_commit(oid)?.tree()? })
  }

  fn read_tree_reference(&self, reference: &str) -> Result<RepoTreeScope<C>> {
    let reference = match reference {
      reference if !reference.starts_with("refs/") => self
        .0
        .find_reference(&format!("refs/heads/{}", reference))
        .or_else(|_| self.0.find_reference(&format!("refs/tags/{}", reference)))?,
      reference => self.0.find_reference(reference)?,
    };

    let reference = match reference.kind() {
      Some(ReferenceType::Symbolic) => reference.resolve()?,
      _ => reference,
    };

    Ok(RepoTreeScope { repo: self, tree: reference.peel_to_tree()? })
  }
}

impl<'t, C: Creds> ReadTree for RepoTreeScope<'t, C> {
  fn exists<P: AsRef<Path>>(&self, path: P) -> Result<bool> {
    match self.tree.get_path(path.as_ref()) {
      Ok(_) => Ok(true),
      Err(err) if err.code() == ErrorCode::NotFound => Ok(false),
      Err(err) => Err(err.into()),
    }
  }

  fn stat<P: AsRef<Path>>(&self, path: P) -> Result<Stat> {
    let entry = self.tree.get_path(path.as_ref())?;
    let object = entry.to_object(&self.repo.0)?;

    let stat = match object.kind() {
      Some(ObjectType::Blob) => {
        let blob = object.into_blob().unwrap();
        Stat { is_binary: blob.is_binary(), is_dir: false, size: blob.size() }
      }
      Some(ObjectType::Tree) => Stat { is_binary: false, is_dir: true, size: 0 },
      _ => {
        return Err(
          git2::Error::new(
            ErrorCode::NotFound,
            ErrorClass::Object,
            "requested object not found in ODB or object is not a blob or tree",
          )
          .into(),
        )
      }
    };

    Ok(stat)
  }

  fn read_dir<P: AsRef<Path>>(&self, path: P) -> Result<Vec<DirEntry>> {
    let tree_object = if path.as_ref().parent().is_none() {
      Some(Cow::Borrowed(&self.tree))
    } else {
      self.tree.get_path(path.as_ref())?.to_object(&self.repo.0)?.into_tree().map(Cow::Owned).ok()
    };

    let Some(tree) = tree_object else {
      return Err(
        git2::Error::new(ErrorCode::Invalid, ErrorClass::Tree, "tried to list directires of file").into(),
      );
    };

    let paths = tree
      .iter()
      .filter(|entry| entry.kind().is_some_and(|k| k == ObjectType::Tree || k == ObjectType::Blob))
      .filter_map(|entry| {
        entry.name().map(|name| DirEntry {
          name: name.to_string(),
          is_dir: entry.kind().is_some_and(|k| k == ObjectType::Tree),
        })
      })
      .collect();
    Ok(paths)
  }

  fn read_to_vec<P: AsRef<Path>>(&self, path: P) -> Result<Vec<u8>> {
    let entry = self.tree.get_path(path.as_ref())?;
    let blob = entry.to_object(&self.repo.0)?.into_blob().map(|b| b.content().to_vec()).unwrap_or_default();
    Ok(blob)
  }

  fn read_to_string<P: AsRef<Path>>(&self, path: P) -> Result<String> {
    let string = String::from_utf8(self.read_to_vec(path)?)
      .map_err(|err| git2::Error::new(ErrorCode::Invalid, ErrorClass::Object, err.to_string()))?;
    Ok(string)
  }
}
