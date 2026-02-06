use std::cell::RefCell;
use std::fmt::Debug;
use std::fmt::Display;

use git2::*;
use indexmap::IndexSet;
use itertools::Itertools;

use crate::creds::Creds;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::prelude::*;

const TAG: &str = "git:walk";

pub trait Walk {
	fn walk(&self, opts: WalkOptions) -> Result<()>;
	fn healthcheck(&self) -> Result<Vec<BadObject>>;
}

#[derive(Clone, Debug)]
pub struct WalkContext {
	pub stage: WalkStage,
	pub seq: Vec<(Oid, ObjectType)>,
}

#[derive(Clone, Debug)]
pub enum WalkStage {
	Revwalk,
	AnyRef,
	Ref(String),
	Index,
}

#[derive(Clone)]
pub struct BadObject {
	pub oid: Oid,
	pub raw_err: String,
	pub ctx: WalkContext,
	pub reason: BadObjectReason,
}

#[derive(Default, Clone)]
#[non_exhaustive]
pub enum BadObjectReason {
	MissingParent {
		idx: usize,
	},
	MissingHead,
	TooManyInvalidOidsInRow,
	#[default]
	Generic,
}

pub struct WalkOptions<'a> {
	pub on_walk: &'a mut dyn FnMut(Oid) -> Result<()>,
	pub should_skip_object: &'a mut dyn FnMut(Oid) -> bool,
	pub on_bad_object: &'a mut dyn FnMut(BadObject),
}

impl<'a> WalkOptions<'a> {
	fn on_walk(&mut self, oid: Oid) -> Result<()> {
		(self.on_walk)(oid)
	}

	fn should_skip_object(&mut self, oid: Oid) -> bool {
		(self.should_skip_object)(oid)
	}

	fn on_bad_object(&mut self, bad_object: BadObject) {
		(self.on_bad_object)(bad_object)
	}
}

impl Display for BadObject {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		match (&self.ctx.stage, &self.reason) {
			(WalkStage::Revwalk, BadObjectReason::MissingHead) => {
				write!(f, "revwalk: failed to push HEAD; err: {}", self.raw_err)?;
			}
			_ => {
				writeln!(f, "bad object {}; err: {}", self.oid, self.raw_err)?;
				write!(f, "while {}", self.ctx)?;
			}
		};
		Ok(())
	}
}

impl Display for WalkContext {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		let stage = match self.stage {
			WalkStage::Revwalk => "revwalk",
			WalkStage::AnyRef => "refs",
			WalkStage::Ref(ref r) => r,
			WalkStage::Index => "index",
		};

		write!(f, "{stage}: ")?;
		let kind2str = |k: ObjectType| match k {
			ObjectType::Any => "any",
			k => k.str(),
		};

		let seq = self.seq.iter().map(|(oid, kind)| format!("{} ({})", oid, kind2str(*kind)));

		for part in Itertools::intersperse(seq, " -> ".to_string()) {
			f.write_str(part.as_str())?;
		}

		Ok(())
	}
}

impl Debug for BadObject {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		write!(f, "{self}")
	}
}

impl<C: Creds> Walk for Repo<'_, C> {
	fn walk(&self, mut opts: WalkOptions) -> Result<()> {
		self.visit_objects_refs(
			&mut opts,
			&mut WalkContext {
				stage: WalkStage::AnyRef,
				seq: vec![],
			},
		)?;
		self.visit_objects_revwalk(
			&mut opts,
			&mut WalkContext {
				stage: WalkStage::Revwalk,
				seq: vec![],
			},
		)?;
		self.visit_objects_index(
			&mut opts,
			&mut WalkContext {
				stage: WalkStage::Index,
				seq: vec![],
			},
		)?;

		Ok(())
	}

	fn healthcheck(&self) -> Result<Vec<BadObject>> {
		let bad_objects = RefCell::new(Vec::new());
		let visited_objects = RefCell::new(IndexSet::new());

		for submodule in self.0.submodules()? {
			if let Some(head_id) = submodule.head_id() {
				visited_objects.borrow_mut().insert(dbg!(head_id));
			}

			if let Some(index_id) = submodule.index_id() {
				visited_objects.borrow_mut().insert(dbg!(index_id));
			}

			if let Some(workdir_id) = submodule.workdir_id() {
				visited_objects.borrow_mut().insert(workdir_id);
			}
		}

		self.walk(WalkOptions {
      on_walk: &mut |oid| {
        visited_objects.borrow_mut().insert(oid);
        Ok(())
      },
      should_skip_object: &mut |oid| visited_objects.borrow().contains(&oid),
      on_bad_object: &mut |o| {
        if o.ctx.seq.len() > 1 && o.ctx.seq.last().unwrap().1 == ObjectType::Commit {
          warn!(target: TAG, "bad commit found; probably this is a submodule and healthcheck does not support it\n\t{}", o.ctx);
          return;
        }

        // TODO(18/08/25): debug why this happens & remove in august release
        if let WalkStage::Ref(ref r) = o.ctx.stage {
          if r.starts_with("refs/stash") {
            if let BadObjectReason::MissingParent { idx } = o.reason {
              if idx > 0 {
                warn!(target: TAG, "found unreachable parent (idx: {}) while walking through {}; idk why but sometimes stashes has unreachable parents with idx >0\n\t{}", idx, r, o.ctx);
                return;
              }
            }
          }
        }

        bad_objects.borrow_mut().push(o)
      },
    })?;

		Ok(bad_objects.into_inner())
	}
}

impl<C: Creds> Repo<'_, C> {
	#[tracing::instrument(skip_all, err)]
	fn visit_objects_revwalk(&self, opts: &mut WalkOptions, ctx: &mut WalkContext) -> Result<()> {
		let mut revwalk = self.0.revwalk()?;
		revwalk.set_sorting(git2::Sort::NONE)?;
		if let Err(err) = revwalk.push_head() {
			opts.on_bad_object(BadObject {
				oid: Oid::zero(),
				raw_err: err.to_string(),
				ctx: ctx.clone(),
				reason: BadObjectReason::MissingHead,
			});
			return Ok(());
		}

		let mut last_failed_oid = None::<git2::Error>;
		let mut failed_oid_count_in_row = 0;

		for oid in revwalk {
			let oid = match oid {
				Ok(oid) => {
					last_failed_oid = None;
					failed_oid_count_in_row = 0;
					oid
				}
				Err(err) => {
					if matches!(last_failed_oid, Some(last_err) if last_err.to_string() == err.to_string()) {
						failed_oid_count_in_row += 1;
					}

					last_failed_oid = Some(err);
					if failed_oid_count_in_row > 5 {
						let message = format!(
							"failed to rewwalk due to too much invalid oids in row with same error; err: {err}",
							err = last_failed_oid.unwrap()
						);

						opts.on_bad_object(BadObject {
							oid: Oid::zero(),
							raw_err: message,
							ctx: ctx.clone(),
							reason: BadObjectReason::TooManyInvalidOidsInRow,
						});

						break;
					} else {
						continue;
					};
				}
			};

			if opts.should_skip_object(oid) {
				trace!(target: TAG, "skipping {oid}");
				continue;
			}

			let commit = self.0.find_commit(oid)?;
			opts.on_walk(commit.id())?;
			ctx.seq.push((commit.id(), ObjectType::Commit));

			self.visit_objects_tree(commit.tree()?, opts, ctx)?;

			ctx.seq.pop();
		}

		Ok(())
	}

	#[tracing::instrument(skip_all, err)]
	fn visit_objects_tree(&self, tree: Tree<'_>, opts: &mut WalkOptions, ctx: &mut WalkContext) -> Result<()> {
		let id = tree.id();

		let use_seq = ctx.seq.last().is_none_or(|o| o.0 != id);

		if use_seq {
			ctx.seq.push((id, ObjectType::Tree));
		}

		opts.on_walk(id)?;

		let mut oids = vec![];

		for entry in tree.iter() {
			oids.push(entry.id());
			let mut predicted_kind = entry.kind();

			if !opts.should_skip_object(entry.id()) {
				while let Some(oid) = oids.pop() {
					self.visit_object_by_oid(oid, opts, ctx, &mut oids, predicted_kind.take())?;
				}
			}
		}

		if use_seq {
			ctx.seq.pop();
		}

		Ok(())
	}

	#[tracing::instrument(skip_all, err)]
	fn visit_objects_refs(&self, opts: &mut WalkOptions, ctx: &mut WalkContext) -> Result<()> {
		let refs = self.0.references()?;

		for reference in refs
			.filter_map(|r| r.ok())
			.filter_map(|r| r.name().map(ToOwned::to_owned))
			.chain(std::iter::once("HEAD".to_string()))
		{
			ctx.stage = WalkStage::Ref(reference.clone());

			if let Ok(reflog) = self.0.reflog(&reference) {
				let mut oids = vec![];

				for entry in reflog.iter() {
					let new_oid = entry.id_new();
					if !new_oid.is_zero() {
						oids.push(new_oid);
					}

					let old_oid = entry.id_old();
					if !old_oid.is_zero() {
						oids.push(old_oid);
					}

					while let Some(id) = oids.pop() {
						self.visit_object_by_oid(id, opts, ctx, &mut oids, None)?;
					}
				}
			}
		}

		Ok(())
	}

	#[tracing::instrument(skip_all, fields(oid = %oid, out_to_see = %out_to_see.len()), err)]
	fn visit_object_by_oid(
		&self,
		oid: Oid,
		opts: &mut WalkOptions,
		ctx: &mut WalkContext,
		out_to_see: &mut Vec<Oid>,
		predicted_kind: Option<ObjectType>,
	) -> Result<()> {
		if opts.should_skip_object(oid) {
			return Ok(());
		}

		ctx.seq.push((oid, predicted_kind.unwrap_or(ObjectType::Any)));

		let Ok(object) = self.0.find_object(oid, None).inspect_err(|err| {
			// error!(target: TAG, "failed to find object: {oid}; err: {err}");

			opts.on_bad_object(BadObject {
				oid,
				raw_err: err.to_string(),
				ctx: ctx.clone(),
				reason: BadObjectReason::Generic,
			});
		}) else {
			ctx.seq.pop();
			return Ok(());
		};
		opts.on_walk(oid)?;

		ctx.seq.last_mut().unwrap().1 = object.kind().unwrap_or(predicted_kind.unwrap_or(ObjectType::Any));

		match object.kind() {
			Some(ObjectType::Commit) => {
				let Some(commit) = object.as_commit() else {
					// error!(target: TAG, "failed to get commit from object: {oid}");
					opts.on_bad_object(BadObject {
						oid,
						raw_err: format!("failed to get commit from object: {oid}"),
						ctx: ctx.clone(),
						reason: BadObjectReason::Generic,
					});

					ctx.seq.pop();
					return Ok(());
				};

				let Ok(tree) = commit.tree().inspect_err(|err| {
					// error!(target: TAG, "failed to get tree from commit: {oid}; err: {err}");
					opts.on_bad_object(BadObject {
						oid,
						raw_err: err.to_string(),
						ctx: ctx.clone(),
						reason: BadObjectReason::Generic,
					});
				}) else {
					ctx.seq.pop();
					return Ok(());
				};

				self.visit_objects_tree(tree, opts, ctx)?;

				let is_gx_stash = commit.message().or_utf8_err()?.starts_with("gx-stash");

				let parent_count = commit.parent_count();
				for i in 0..parent_count {
					let parent = match commit.parent(i) {
						Ok(parent) => parent,
						Err(e) => {
							let msg = format!(
								"{}failed to get parent({i}) from commit: {oid}; original err: {e}",
								if is_gx_stash { "(gx)" } else { "" }
							);
							// error!(target: TAG, "{msg}");
							opts.on_bad_object(BadObject {
								oid,
								raw_err: msg,
								ctx: ctx.clone(),
								reason: BadObjectReason::MissingParent { idx: i },
							});
							continue;
						}
					};

					out_to_see.push(parent.id());
				}
			}
			Some(ObjectType::Tree) => {
				if let Ok(tree) = object.peel_to_tree() {
					self.visit_objects_tree(tree, opts, ctx)?;
				}
			}
			Some(ObjectType::Tag) => {
				if let Ok(tag) = object.peel_to_tag() {
					self.visit_object_by_oid(tag.target_id(), opts, ctx, out_to_see, None)?;
				}
			}
			Some(ObjectType::Blob | ObjectType::Any) | None => {}
		}

		ctx.seq.pop();

		Ok(())
	}

	#[tracing::instrument(skip_all, err)]
	fn visit_objects_index(&self, opts: &mut WalkOptions, ctx: &mut WalkContext) -> Result<()> {
		let index = self.0.index()?;
		let mut oids = vec![];

		for entry in index.iter() {
			oids.push(entry.id);

			while let Some(oid) = oids.pop() {
				self.visit_object_by_oid(oid, opts, ctx, &mut oids, None)?;
			}
		}

		Ok(())
	}
}
