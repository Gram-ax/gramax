use std::borrow::Cow;

use git2::*;
use serde::Serialize;

use crate::creds::Creds;
use crate::prelude::*;
use crate::Result;
use crate::ShortInfo;

pub trait Tags {
  fn find_tag_tree_by_name(&self, tagname: &str) -> Result<Tree<'_>>;
}

pub(crate) struct AnnotatedTag<'t>(pub(crate) &'t str, pub(crate) &'t Commit<'t>);

impl<'t> ShortInfo<'t, TagInfo> for AnnotatedTag<'_> {
  fn short_info(&self) -> Result<TagInfo> {
    Ok(TagInfo {
      name: self.0.to_string(),
      oid: self.1.id().to_string(),
      is_lightweight: true,
      author: self.1.author().name().map(|s| s.to_string()),
      date: Some(self.1.author().when().seconds() * 1000i64),
    })
  }
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct TagInfo {
  pub name: String,
  pub oid: String,
  pub is_lightweight: bool,
  pub author: Option<String>,
  pub date: Option<i64>,
}

impl<'t> ShortInfo<'t, TagInfo> for Tag<'_> {
  fn short_info(&self) -> Result<TagInfo> {
    let tagger = self.tagger();
    let commit_oid = self.target_id();
    Ok(TagInfo {
      name: self.name().unwrap_or_default().to_string(),
      oid: commit_oid.to_string(),
      is_lightweight: false,
      author: tagger.as_ref().and_then(|t| t.name().map(|s| s.to_string())),
      date: tagger.as_ref().map(|t| t.when().seconds() * 1000i64),
    })
  }
}

impl<C: Creds> Tags for Repo<C> {
  fn find_tag_tree_by_name(&self, tagname: &str) -> Result<Tree<'_>> {
    let tagname = if tagname.contains("refs/tags") {
      Cow::Borrowed(tagname)
    } else {
      Cow::Owned(format!("refs/tags/{}", tagname))
    };

    let tag = self.0.find_reference(&tagname)?;
    Ok(tag.resolve()?.peel_to_tree()?)
  }
}
