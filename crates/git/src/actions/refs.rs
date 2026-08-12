use std::borrow::Cow;
use std::collections::HashMap;
use std::collections::HashSet;

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
			refname: self.get().name().or_utf8_err()?.to_string(),
			name: self.name()?.or_utf8_err()?.to_string(),
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
	fn find_local_refs(&self) -> Result<Vec<String>>;
	fn find_refs_by_globs<S: AsRef<str>>(&self, patterns: &[S]) -> Result<Vec<RefInfo>>;
	fn find_reference_pointee_info(&self, reference: &Reference) -> Result<Option<RefInfo>>;
}

impl<C: Creds> Refs for Repo<'_, C> {
	fn find_local_refs(&self) -> Result<Vec<String>> {
		let mut local_refs = vec![];
		let mut remote_refs = vec![];

		for reference in self.0.references()? {
			let reference = reference?;
			let refname = reference.name().or_utf8_err()?;
			match refname {
				refname if refname.starts_with("refs/heads/") => local_refs.push(refname.to_string()),
				refname if refname.starts_with("refs/remotes/origin/") => remote_refs.push(refname.to_string()),
				refname => {
					warn!(target: TAG, "found reference {refname} but it is not a local or remote reference; skipping")
				}
			};
		}

		local_refs.retain(|refname| !remote_refs.contains(&format!("refs/remotes/origin/{}", refname.trim_start_matches("refs/heads/"))));

		Ok(local_refs)
	}

	fn find_refs_by_globs<S: AsRef<str>>(&self, patterns: &[S]) -> Result<Vec<RefInfo>> {
		let mut refs = HashMap::new();
		// name -> (came from origin, info)
		let mut remote_refs: HashMap<String, (bool, RefInfo)> = HashMap::new();

		for pattern in patterns {
			let pattern = if pattern.as_ref().starts_with("refs/") {
				Cow::Borrowed(pattern.as_ref())
			} else {
				Cow::Owned(format!("**/{}", pattern.as_ref()))
			};

			for reference in self.0.references_glob(pattern.as_ref())? {
				let reference = reference?;
				let refname = reference.name().or_utf8_err()?.to_string();

				// A branch that has never been checked out here exists only as refs/remotes/<remote>/<name>
				// — the shape a fresh clone (and every docportal bare clone) has. It is still a branch of
				// this repository, so it belongs in the list under its plain name; a local branch of the
				// same name wins over it below.
				if reference.is_remote() {
					let Some(name) = remote_branch_name(&refname).map(|name| name.to_string()) else {
						continue;
					};
					// The same branch name can live in several remotes. read_tree_reference resolves such a
					// name with origin first, so the winner here has to be origin too — otherwise the list
					// shows one remote's commit and date while the content is read from another.
					let is_origin = refname.starts_with("refs/remotes/origin/");
					if let Some((origin_wins, _)) = remote_refs.get(&name) {
						if *origin_wins || !is_origin {
							continue;
						}
					}
					if let Some(ref_info) = remote_branch_info(&reference, &refname, &name) {
						remote_refs.insert(name, (is_origin, ref_info));
					}
					continue;
				}

				if refs.contains_key(&refname) {
					continue;
				}

				if let Some(ref_info) = self.find_reference_pointee_info(&reference)? {
					refs.insert(refname, ref_info);
				}
			}
		}

		let local_names = refs
			.values()
			.map(|info| match info {
				RefInfo::Tag { name, .. } | RefInfo::Branch { name, .. } => name.clone(),
			})
			.collect::<HashSet<_>>();

		let mut refs = refs.into_values().collect::<Vec<_>>();
		refs.extend(
			remote_refs
				.into_iter()
				.filter(|(name, _)| !local_names.contains(name))
				.map(|(_, (_, info))| info),
		);

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

		let refname = match reference.name().or_utf8_err()? {
			refname if refname.starts_with("refs/tags/") => refname.split_at("refs/tags/".len()).1,
			refname if refname.starts_with("refs/heads/") => refname.split_at("refs/heads/".len()).1,
			refname => refname,
		};

		if reference.is_branch() {
			match self.0.find_branch(refname, BranchType::Local) {
				Ok(branch) => return Ok(Some(branch.short_info()?)),
				Err(e) => {
					warn!(target: TAG, "failed to resolve branch {refname} while collecting refnames; skipping; error: {e}")
				}
			}

			return Ok(None);
		}

		let Some(oid) = reference.target().or_else(|| reference.target_peel()) else {
			warn!(target: TAG, "tried to peel reference {refname} to target but pointee not found; skipping");
			return Ok(None);
		};

		let object = match self.0.find_object(oid, None) {
			Ok(object) => object,
			Err(err) => {
				warn!(target: TAG, "tried to find object {refname} ({oid}) but failed; skipping; error: {err}");
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

/// `refs/remotes/<remote>/<name>` → `<name>`. The remote's own HEAD pointer is not a branch, so it is
/// filtered out here rather than showing up as a version called `HEAD`.
fn remote_branch_name(refname: &str) -> Option<&str> {
	let rest = refname.strip_prefix("refs/remotes/")?;
	let (_remote, name) = rest.split_once('/')?;
	if name.is_empty() || name == "HEAD" {
		return None;
	}
	Some(name)
}

fn remote_branch_info(reference: &Reference, refname: &str, name: &str) -> Option<RefInfo> {
	let Ok(commit) = reference.peel_to_commit() else {
		warn!(target: TAG, "tried to peel remote branch {refname} to a commit but failed; skipping");
		return None;
	};

	Some(RefInfo::Branch {
		refname: refname.to_string(),
		name: name.to_string(),
		date: Some(commit.time().seconds() * 1000),
	})
}
