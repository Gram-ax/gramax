use std::borrow::Cow;
use std::collections::HashMap;

use git2::*;
use serde::Serialize;

use crate::creds::*;
use crate::error::*;
use crate::prelude::*;

use super::tags::AnnotatedTag;

const TAG: &str = "git:refs";

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "kind")]
pub enum RefInfo {
  Tag {
    refname: String,
    name: String,
    oid: String,
    is_lightweight: bool,
    author: Option<String>,
    date: Option<i64>,
  },
  Branch {
    refname: String,
    name: String,
    date: Option<i64>,
  },
}

impl ShortInfo<'_, RefInfo> for git2::Branch<'_> {
  fn short_info(&self) -> Result<RefInfo> {
    Ok(RefInfo::Branch {
      refname: self.get().name().ok_or(crate::error::Error::Utf8)?.to_string(),
      name: self.name()?.ok_or(crate::error::Error::Utf8)?.to_string(),
      date: self.get().peel_to_commit().map(|c| c.time().seconds() * 1000).ok(),
    })
  }
}

impl From<TagInfo> for RefInfo {
  fn from(value: TagInfo) -> Self {
    RefInfo::Tag {
      refname: format!("refs/tags/{}", value.name),
      name: value.name,
      oid: value.oid,
      is_lightweight: value.is_lightweight,
      author: value.author,
      date: value.date,
    }
  }
}

pub trait Refs {
  fn find_refs_by_globs<S: AsRef<str>>(&self, patterns: &[S]) -> Result<Vec<RefInfo>>;
  fn find_reference_pointee_info(&self, reference: &Reference) -> Result<Option<RefInfo>>;
}

impl<C: Creds> Refs for Repo<C> {
  fn find_refs_by_globs<S: AsRef<str>>(&self, patterns: &[S]) -> Result<Vec<RefInfo>> {
    let mut refs = HashMap::new();

    for pattern in patterns {
      let pattern = if pattern.as_ref().starts_with("refs/") {
        Cow::Borrowed(pattern.as_ref())
      } else {
        Cow::Owned(format!("**/{}", pattern.as_ref()))
      };

      for reference in self.0.references_glob(pattern.as_ref())? {
        let reference = reference?;
        let refname = reference.name().ok_or(crate::error::Error::Utf8)?;
        if refs.contains_key(refname) {
          continue;
        }

        if let Some(ref_info) = self.find_reference_pointee_info(&reference)? {
          refs.insert(refname.to_string(), ref_info);
        }
      }
    }

    let mut refs = refs.into_values().collect::<Vec<_>>();

    refs.sort_by(|a, b| match (a, b) {
      (
        RefInfo::Tag { date: date_a, .. } | RefInfo::Branch { date: date_a, .. },
        RefInfo::Tag { date: date_b, .. } | RefInfo::Branch { date: date_b, .. },
      ) => date_a.cmp(date_b),
    });

    Ok(refs)
  }

  fn find_reference_pointee_info(&self, reference: &Reference) -> Result<Option<RefInfo>> {
    let reference = match reference.kind() {
      Some(ReferenceType::Symbolic) => &reference.resolve()?,
      _ => reference,
    };

    if reference.is_note() || reference.is_remote() {
      return Ok(None);
    }

    let refname = match reference.name().ok_or(crate::error::Error::Utf8)? {
      refname if refname.starts_with("refs/tags/") => refname.split_at("refs/tags/".len()).1,
      refname if refname.starts_with("refs/heads/") => refname.split_at("refs/heads/".len()).1,
      refname => refname,
    };

    if reference.is_branch() {
      match self.0.find_branch(refname, BranchType::Local) {
        Ok(branch) => return Ok(Some(branch.short_info()?)),
        Err(e) => {
          warn!(target: TAG, "failed to resolve branch {} while collecting refnames; skipping; error: {}", refname, e)
        }
      }

      return Ok(None);
    }

    let Some(oid) = reference.target().or_else(|| reference.target_peel()) else {
      warn!(target: TAG, "tried to peel reference {} to target but pointee not found; skipping", refname);
      return Ok(None);
    };

    let object = match self.0.find_object(oid, None) {
      Ok(object) => object,
      Err(err) => {
        warn!(target: TAG, "tried to find object {} ({}) but failed; skipping; error: {}", refname, oid.to_string(), err);
        return Ok(None);
      }
    };

    match object.kind() {
      Some(ObjectType::Tag) => {
        if let Ok(tag) = object.peel_to_tag() {
          if let Ok(tag_info) = tag.short_info() {
            return Ok(Some(tag_info.into()));
          }
        }
      }
      Some(ObjectType::Commit) => {
        if let Ok(commit) = object.peel_to_commit() {
          if let Ok(tag_info) = AnnotatedTag(refname, &commit).short_info() {
            return Ok(Some(tag_info.into()));
          }
        }
      }
      _ => (),
    }

    Ok(None)
  }
}
