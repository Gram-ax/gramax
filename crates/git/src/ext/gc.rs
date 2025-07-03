use git2::*;
use indexmap::IndexSet;

use crate::creds::Creds;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::prelude::*;
use crate::time_now;

const TAG: &str = "git:gc";

pub trait Gc {
  fn gc(&self, opts: GcOptions) -> Result<()>;
}

#[derive(serde::Deserialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GcOptions {
  pub loose_objects_limit: Option<usize>,
  pub pack_files_limit: Option<usize>,
}

impl<C: Creds> Gc for Repo<C> {
  fn gc(&self, opts: GcOptions) -> Result<()> {
    let start = time_now();
    let loose_objects = self.collect_loose_objects()?;
    let time_loose_objects = time_now() - start;

    let start = time_now();
    let unreachable_objects = self.collect_unreachable_objects(&loose_objects)?;
    let time_unreachable_objects = time_now() - start;

    if !unreachable_objects.is_empty() {
      info!(
        target: TAG,
        "found {count} unreachable loose objects in {time:?} (counting took {time_loose:?}){limit}",
        count = unreachable_objects.len(),
        time = time_unreachable_objects,
        time_loose = time_loose_objects,
        limit = opts.loose_objects_limit.as_ref().map_or("".to_string(), |limit| format!("; limit set to {}", limit))
      );

      self.remove_objects(&unreachable_objects)?;
    } else {
      info!(
        target: TAG, "no unreachable loose objects found in {time:?} (counting took {time_loose:?})",
        time = time_unreachable_objects,
        time_loose = time_loose_objects
      );
    }

    if let Some(limit) = opts.loose_objects_limit {
      let loose_objects = self.collect_loose_objects()?;

      if loose_objects.len() > limit {
        info!(target: TAG, "loose objects limit ({} > {} limit) reached; packing...", loose_objects.len(), limit);
        self.repack(&loose_objects)?;
      }
    }

    Ok(())
  }
}

impl<C: Creds> Repo<C> {
  pub fn collect_loose_objects(&self) -> Result<IndexSet<Oid>> {
    let objects_dir = self.0.path().join("objects");
    let exclude = ["pack", "info"];

    let subdirs = std::fs::read_dir(&objects_dir)?
      .filter_map(|readdir| readdir.ok())
      .filter(|entry| {
        entry.file_type().is_ok_and(|t| t.is_dir())
          && entry.file_name().to_str().is_some_and(|name| !exclude.contains(&name))
      })
      .collect::<Vec<_>>();

    let count = subdirs
      .iter()
      .flat_map(|entry| {
        let subdir_path = entry.path();
        match std::fs::read_dir(subdir_path) {
          Ok(entries) => entries
            .filter_map(|readdir| readdir.ok())
            .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
            .map(|e| e.path())
            .collect::<Vec<_>>(),
          Err(_) => Vec::new(),
        }
      })
      .filter_map(|path| {
        let file_name = path.file_name()?.to_str()?;
        let prefix = path.parent()?.file_name()?.to_str()?;
        let oid_str = format!("{}{}", prefix, file_name);

        Oid::from_str(&oid_str)
          .inspect_err(|e| {
            error!(
              target: TAG,
              "failed to parse oid: {}; raw: {}; path: {}", e, oid_str, path.display()
            );
          })
          .ok()
      })
      .collect::<IndexSet<_>>();

    Ok(count)
  }

  pub fn remove_objects(&self, objects: &IndexSet<Oid>) -> Result<()> {
    info!(target: TAG, "removing {} objects", objects.len());

    let objects_path = self.0.path().join("objects");
    let mut prefixes = std::collections::HashSet::new();

    objects
      .iter()
      .map(|oid| {
        let oid_str = oid.to_string();
        let (prefix, file_name) = oid_str.split_at(2);
        prefixes.insert(prefix.to_string());
        let path = objects_path.join(prefix).join(file_name);
        trace!(target: TAG, "removing object: {}", path.display());
        std::fs::remove_file(&path)
          .map_err(|e| format!("failed to remove object {} (at {}): {}", oid, path.display(), e))
      })
      .filter_map(|r| r.err())
      .for_each(|error| error!(target: TAG, "{}", error));

    prefixes
      .iter()
      .map(|prefix| objects_path.join(prefix))
      .filter(|prefix| std::fs::read_dir(prefix).ok().and_then(|mut e| e.next()).is_none())
      .map(|prefix| {
        std::fs::remove_dir(&prefix)
          .map_err(|e| format!("failed to remove empty dir {}: {}", prefix.display(), e))
      })
      .filter_map(|r| r.err())
      .for_each(|error| {
        error!(target: TAG, "{}", error);
      });

    let odb = self.0.odb()?;
    odb.refresh()?;

    Ok(())
  }

  pub fn collect_unreachable_objects(&self, loose_objects: &IndexSet<Oid>) -> Result<IndexSet<Oid>> {
    let mut visited_objects = IndexSet::new();

    self.visit_objects_index(&mut visited_objects)?;
    self.visit_objects_revwalk(&mut visited_objects)?;
    self.visit_objects_refs(&mut visited_objects)?;

    Ok(loose_objects.difference(&visited_objects).cloned().collect())
  }

  fn visit_objects_revwalk(&self, visited_objects: &mut IndexSet<Oid>) -> Result<()> {
    let mut revwalk = self.0.revwalk()?;
    revwalk.set_sorting(git2::Sort::NONE)?;
    revwalk.push_head()?;

    for oid in revwalk.filter_map(|id| id.ok()) {
      if visited_objects.contains(&oid) {
        trace!(target: TAG, "skipping {}", oid);
        continue;
      }

      let commit = self.0.find_commit(oid)?;

      visited_objects.insert(oid);
      self.visit_objects_tree(commit.tree()?, visited_objects)?;
    }

    Ok(())
  }

  fn visit_objects_tree(&self, tree: Tree<'_>, visited_objects: &mut IndexSet<Oid>) -> Result<()> {
    let id = tree.id();

    visited_objects.insert(id);

    for entry in tree.iter() {
      if entry.kind() == Some(ObjectType::Tree) && !visited_objects.contains(&entry.id()) {
        self.visit_objects_tree(self.0.find_tree(entry.id())?, visited_objects)?;
      }

      visited_objects.insert(entry.id());
    }

    Ok(())
  }

  fn visit_objects_refs(&self, visited_objects: &mut IndexSet<Oid>) -> Result<()> {
    let refs = self.0.references()?;

    for reference in refs
      .filter_map(|r| r.ok())
      .filter_map(|r| r.name().map(ToOwned::to_owned))
      .chain(std::iter::once("HEAD".to_string()))
    {
      if let Ok(reflog) = self.0.reflog(&reference) {
        for entry in reflog.iter() {
          let new_oid = entry.id_new();

          if visited_objects.contains(&new_oid) {
            continue;
          }

          if let Ok(commit) = self.0.find_commit(new_oid) {
            visited_objects.insert(new_oid);
            if let Ok(tree) = commit.tree() {
              self.visit_objects_tree(tree, visited_objects)?;
            }
          }

          let old_oid = entry.id_old();
          if old_oid.is_zero() {
            continue;
          }

          if let Ok(commit) = self.0.find_commit(old_oid) {
            visited_objects.insert(old_oid);
            if let Ok(tree) = commit.tree() {
              self.visit_objects_tree(tree, visited_objects)?;
            }
          }
        }
      }
    }

    Ok(())
  }

  fn visit_objects_index(&self, visited_objects: &mut IndexSet<Oid>) -> Result<()> {
    let index = self.0.index()?;

    for entry in index.iter() {
      visited_objects.insert(entry.id);
    }

    Ok(())
  }

  fn repack(&self, objects: &IndexSet<Oid>) -> Result<()> {
    let start = time_now();
    let mut packbuilder = self.0.packbuilder()?;
    packbuilder.set_threads(6);

    for oid in objects {
      packbuilder.insert_object(*oid, None)?;
    }

    let packs_dir = self.0.path().join("objects/pack/");
    packbuilder.write(&packs_dir, 0o644)?;

    self.remove_objects(objects)?;
    let time_repack = time_now() - start;

    let pack_name = packbuilder.name().or_utf8_err()?;
    let pack_dir = self.0.path().join("objects/pack");
    std::fs::create_dir_all(&pack_dir)?;
    let packfile_path = pack_dir.join(pack_name).with_extension("pack");

    info!(target: TAG, "repacked {} objects in {:?}; packfile: {}", packbuilder.written(), time_repack, packfile_path.display());
    Ok(())
  }
}
