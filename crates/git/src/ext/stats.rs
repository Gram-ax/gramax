use std::cell::RefCell;
use std::collections::HashSet;

use git2::*;
use serde::Serialize;

use crate::creds::Creds;
use crate::error::Result;
use crate::ext::walk::*;
use crate::prelude::*;

pub trait RepoStats {
	fn collect_storage_stats(&self) -> Result<StorageStats>;
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
	pub pack_files: SizeStats,
	pub loose_objects: LooseObjectsStats,
	pub lfs_objects: LfsObjectsStats,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SizeStats {
	pub count: usize,
	pub size: u64,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LooseObjectsStats {
	pub count: usize,
	pub size: u64,
	pub unreachable_count: usize,
	pub unreachable_size: u64,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LfsObjectsStats {
	pub count: usize,
	pub size: u64,
	pub prunable_count: usize,
	pub prunable_size: u64,
}

impl<C: Creds> RepoStats for Repo<'_, C> {
	fn collect_storage_stats(&self) -> Result<StorageStats> {
		let pack_files = self.collect_pack_stats()?;
		let loose_objects = self.collect_loose_stats()?;
		let lfs_objects = self.collect_lfs_stats()?;

		Ok(StorageStats {
			pack_files,
			loose_objects,
			lfs_objects,
		})
	}
}

pub(crate) type WalkLfsDirResult = (usize, u64, Vec<(String, u64)>); // (count, size, list of (hash, file_size))

impl<C: Creds> Repo<'_, C> {
	fn collect_pack_stats(&self) -> Result<SizeStats> {
		let pack_dir = self.0.path().join("objects/pack");

		let (count, size) = match std::fs::read_dir(&pack_dir) {
			Ok(entries) => entries
				.filter_map(|e| e.ok())
				.filter(|e| e.path().extension().is_some_and(|ext| ext == "pack"))
				.fold((0usize, 0u64), |(count, size), entry| {
					let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);
					(count + 1, size + file_size)
				}),
			Err(_) => (0, 0),
		};

		Ok(SizeStats { count, size })
	}

	fn collect_loose_stats(&self) -> Result<LooseObjectsStats> {
		let objects_dir = self.0.path().join("objects");
		let exclude = ["pack", "info"];

		let mut count = 0usize;
		let mut size = 0u64;
		let mut loose_oids = HashSet::new();

		let subdirs = std::fs::read_dir(&objects_dir)?
			.filter_map(|e| e.ok())
			.filter(|entry| entry.file_type().is_ok_and(|t| t.is_dir()) && entry.file_name().to_str().is_some_and(|name| !exclude.contains(&name)));

		for subdir in subdirs {
			let Ok(entries) = std::fs::read_dir(subdir.path()) else {
				continue;
			};

			for entry in entries.filter_map(|e| e.ok()) {
				if !entry.file_type().map(|t| t.is_file()).unwrap_or(false) {
					continue;
				}

				let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);
				count += 1;
				size += file_size;

				let path = entry.path();
				if let (Some(prefix), Some(file_name)) = (
					path.parent().and_then(|p| p.file_name()).and_then(|n| n.to_str()),
					path.file_name().and_then(|n| n.to_str()),
				) {
					let oid_str = format!("{prefix}{file_name}");
					if let Ok(oid) = Oid::from_str(&oid_str) {
						loose_oids.insert(oid);
					}
				}
			}
		}

		let unreachable_oids = self.collect_unreachable_objects(&loose_oids)?;
		let unreachable_count = unreachable_oids.len();
		let unreachable_size = self.measure_loose_objects_size(&unreachable_oids);

		Ok(LooseObjectsStats {
			count,
			size,
			unreachable_count,
			unreachable_size,
		})
	}

	fn measure_loose_objects_size(&self, oids: &HashSet<Oid>) -> u64 {
		let objects_dir = self.0.path().join("objects");
		oids
			.iter()
			.map(|oid| {
				let oid_str = oid.to_string();
				let (prefix, file_name) = oid_str.split_at(2);
				let path = objects_dir.join(prefix).join(file_name);
				std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0)
			})
			.sum()
	}

	fn collect_lfs_stats(&self) -> Result<LfsObjectsStats> {
		let lfs_dir = self.0.path().join("lfs/objects");

		let (total_count, total_size, all_lfs_files) = match Self::walk_lfs_dir(&lfs_dir) {
			Some(result) => result,
			None => {
				return Ok(LfsObjectsStats {
					count: 0,
					size: 0,
					prunable_count: 0,
					prunable_size: 0,
				})
			}
		};

		let reachable_lfs_hashes = self.collect_reachable_lfs_hashes()?;

		let (prunable_count, prunable_size) = all_lfs_files
			.iter()
			.filter(|(hash, _)| !reachable_lfs_hashes.contains(hash.as_str()))
			.fold((0usize, 0u64), |(count, size), (_, file_size)| (count + 1, size + file_size));

		Ok(LfsObjectsStats {
			count: total_count,
			size: total_size,
			prunable_count,
			prunable_size,
		})
	}

	pub(crate) fn walk_lfs_dir(lfs_dir: &std::path::Path) -> Option<WalkLfsDirResult> {
		if !lfs_dir.exists() {
			return None;
		}

		let mut count = 0usize;
		let mut size = 0u64;
		let mut files = Vec::new();

		let Ok(prefix_dirs) = std::fs::read_dir(lfs_dir) else {
			return None;
		};

		for prefix_entry in prefix_dirs.filter_map(|e| e.ok()) {
			if !prefix_entry.file_type().is_ok_and(|t| t.is_dir()) {
				continue;
			}

			let Ok(mid_dirs) = std::fs::read_dir(prefix_entry.path()) else {
				continue;
			};

			for mid_entry in mid_dirs.filter_map(|e| e.ok()) {
				if !mid_entry.file_type().is_ok_and(|t| t.is_dir()) {
					continue;
				}

				let Ok(entries) = std::fs::read_dir(mid_entry.path()) else {
					continue;
				};

				for entry in entries.filter_map(|e| e.ok()) {
					if !entry.file_type().is_ok_and(|t| t.is_file()) {
						continue;
					}

					let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);
					count += 1;
					size += file_size;

					if let Some(hash) = entry.file_name().to_str().map(|s| s.to_string()) {
						files.push((hash, file_size));
					}
				}
			}
		}

		Some((count, size, files))
	}

	pub(crate) fn collect_reachable_lfs_hashes(&self) -> Result<HashSet<String>> {
		let visited_objects = RefCell::new(HashSet::new());
		let lfs_hashes = RefCell::new(HashSet::new());

		let opts = WalkOptions {
			on_walk: &mut |oid| {
				visited_objects.borrow_mut().insert(oid);

				if let Ok(blob) = self.0.find_blob(oid) {
					if let Some(pointer) = git2_lfs::Pointer::from_str_short(blob.content()) {
						lfs_hashes.borrow_mut().insert(pointer.hex());
					}
				}

				Ok(())
			},
			should_skip_object: &mut |oid| visited_objects.borrow().contains(&oid),
			on_bad_object: &mut |_| {},
			skip_revwalk: true,
		};

		self.walk(opts)?;

		Ok(lfs_hashes.into_inner())
	}
}
