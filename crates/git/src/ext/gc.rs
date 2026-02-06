use std::cell::RefCell;
use std::fmt::Display;

use git2::*;
use indexmap::IndexSet;
use itertools::intersperse;
use itertools::Itertools;

use crate::creds::Creds;
use crate::error::OrUtf8Err;
use crate::error::Result;
use crate::ext::walk::*;
use crate::prelude::*;
use crate::time_now;

const TAG: &str = "git:gc";

pub trait Gc {
	fn gc(&self, opts: GcOptions) -> Result<()>;
	fn last_gc(&self) -> Result<Option<GcLog>>;
}

#[derive(serde::Deserialize, Clone, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct GcOptions {
	pub loose_objects_limit: Option<usize>,
	pub pack_files_limit: Option<usize>,
}

#[derive(Debug)]
pub struct HealthcheckError {
	pub inner: Option<git2::Error>,
	pub bad_objects: Option<Vec<BadObject>>,
	pub prev_log: Option<GcLog>,
}

impl std::error::Error for HealthcheckError {
	fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
		self.inner.as_ref().map(|e| e as &dyn std::error::Error)
	}
}

#[derive(Clone, Debug)]
pub struct GcLog {
	pub timestamp_sec: u64,
	pub log: Option<String>,
}

impl Display for GcLog {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		let datetime = chrono::DateTime::from_timestamp(self.timestamp_sec as i64, 0).unwrap_or_default();
		writeln!(f, "timestamp: {}", datetime.format("%H:%M:%S %d.%m.%Y"))?;

		if let Some(log) = &self.log {
			write!(f, "\n{log}")?;
		}

		Ok(())
	}
}

impl Display for HealthcheckError {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		if let Some(inner) = &self.inner {
			writeln!(f, "{inner}")?;
		}

		if let Some(bad_objects) = &self.bad_objects {
			let uniq = bad_objects.iter().unique_by(|o| o.oid).collect::<Vec<_>>();
			let has_duplicates = uniq.len() != bad_objects.len();

			writeln!(f, "found {} bad objects:", uniq.len())?;

			for bad_object in &uniq {
				writeln!(f, "- {bad_object}\n")?;
			}

			if has_duplicates {
				let duplicates = bad_objects.iter().duplicates_by(|o| o.oid).collect::<Vec<_>>();
				writeln!(f, "and {} duplicate bad objects:", duplicates.len())?;
				for bad_object in duplicates {
					writeln!(f, "- {bad_object}\n")?;
				}
			}
		}

		if let Some(prev_log) = &self.prev_log {
			writeln!(f, "previous gc log:\n{prev_log}")?;
		}
		Ok(())
	}
}

impl<C: Creds> Gc for Repo<'_, C> {
	fn gc(&self, opts: GcOptions) -> Result<()> {
		let last_gc = self.last_gc()?;

		if let Some(ref last_gc) = last_gc {
			info!(target: TAG, "last gc {last_gc}");
		}

		let gc_res = self.gc_inner(opts);

		let bad_objects = self.healthcheck()?;
		self.write_gc_log(&gc_res, &bad_objects)?;
		self.handle_gc_result(gc_res, bad_objects, last_gc)
	}

	fn last_gc(&self) -> Result<Option<GcLog>> {
		let log_path = self.0.path().join("gramax/gc.log");
		let log = match std::fs::read_to_string(&log_path) {
			Ok(log) => log,
			Err(err) => {
				debug!(target: TAG, ?log_path, "last gc log not found: {err}");
				return Ok(None);
			}
		};

		let mut lines = log.lines();
		let timestamp_sec = lines.next().and_then(|l| l.trim().parse::<u64>().ok());
		let log = intersperse(lines, "\n").collect::<String>().trim().to_string();

		let gc_log = timestamp_sec.map(|timestamp_sec| GcLog {
			timestamp_sec,
			log: if log.is_empty() { None } else { Some(log) },
		});

		Ok(gc_log)
	}
}

impl<C: Creds> Repo<'_, C> {
	pub fn collect_unreachable_objects(&self, loose_objects: &IndexSet<Oid>) -> Result<IndexSet<Oid>> {
		let visited_objects = RefCell::new(IndexSet::new());

		let opts = WalkOptions {
			on_walk: &mut |oid| {
				visited_objects.borrow_mut().insert(oid);
				Ok(())
			},
			should_skip_object: &mut |oid| visited_objects.borrow().contains(&oid),
			on_bad_object: &mut |_| {},
		};

		self.walk(opts)?;

		Ok(loose_objects.difference(&visited_objects.into_inner()).cloned().collect())
	}

	pub fn collect_loose_objects(&self) -> Result<IndexSet<Oid>> {
		let objects_dir = self.0.path().join("objects");
		let exclude = ["pack", "info"];

		let subdirs = std::fs::read_dir(&objects_dir)?
			.filter_map(|readdir| readdir.ok())
			.filter(|entry| entry.file_type().is_ok_and(|t| t.is_dir()) && entry.file_name().to_str().is_some_and(|name| !exclude.contains(&name)))
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
				let oid_str = format!("{prefix}{file_name}");

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

	pub fn debug_remove_object(&mut self, objects: &[Oid]) -> Result<()> {
		let mut set = IndexSet::new();
		for oid in objects {
			set.insert(*oid);
		}
		self.remove_objects(&set)?;
		self.reopen()?;
		Ok(())
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
				std::fs::remove_file(&path).map_err(|e| format!("failed to remove object {} (at {}): {}", oid, path.display(), e))
			})
			.filter_map(|r| r.err())
			.for_each(|error| error!(target: TAG, "{error}"));

		prefixes
			.iter()
			.map(|prefix| objects_path.join(prefix))
			.filter(|prefix| std::fs::read_dir(prefix).ok().and_then(|mut e| e.next()).is_none())
			.map(|prefix| std::fs::remove_dir(&prefix).map_err(|e| format!("failed to remove empty dir {}: {}", prefix.display(), e)))
			.filter_map(|r| r.err())
			.for_each(|error| {
				error!(target: TAG, "{error}");
			});

		let odb = self.0.odb()?;
		odb.refresh()?;

		Ok(())
	}

	fn gc_inner(&self, opts: GcOptions) -> Result<IndexSet<Oid>> {
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
				limit = opts.loose_objects_limit.as_ref().map_or("".to_string(), |limit| format!("; limit set to {limit}"))
			);

			self.remove_lfs_objects(&unreachable_objects)?;
			self.remove_objects(&unreachable_objects)?;
		} else {
			info!(
				target: TAG, "no unreachable loose objects found in {time_unreachable_objects:?} (counting took {time_loose_objects:?})"
			);
		}

		if let Some(limit) = opts.loose_objects_limit {
			let loose_objects = self.collect_loose_objects()?;

			if loose_objects.len() > limit {
				info!(target: TAG, "loose objects limit ({} > {} limit) reached; packing...", loose_objects.len(), limit);
				self.repack(&loose_objects)?;
			}
		}

		Ok(unreachable_objects)
	}

	fn repack(&self, objects: &IndexSet<Oid>) -> Result<()> {
		let start = time_now();
		self.ensure_objects_dir_exists()?;
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

	fn remove_lfs_objects(&self, objects: &IndexSet<Oid>) -> Result<()> {
		for oid in objects {
			let Ok(object) = self.0.find_blob(*oid) else {
				warn!(target: TAG, "remove lfs objects: failed to find blob {oid}; skipping");
				continue;
			};

			let Some(pointer) = git2_lfs::Pointer::from_str_short(object.content()) else {
				continue;
			};

			let path = self.0.path().join("lfs/objects").join(pointer.path());
			if path.exists() {
				std::fs::remove_file(&path)?;
			}
		}

		Ok(())
	}

	fn write_gc_log(&self, gc_res: &Result<IndexSet<Oid>>, bad_objects: &[BadObject]) -> Result<()> {
		use std::io::Write;

		let log_dir_path = self.0.path().join("gramax");
		std::fs::create_dir_all(&log_dir_path)?;

		let log_path = log_dir_path.join("gc.log");
		let mut file = std::fs::File::create(log_path)?;
		file.write_all(format!("{}\n", crate::time_now().as_secs()).as_bytes())?;
		file.write_all(bad_objects.iter().map(|o| format!("{o}\n")).collect::<Vec<_>>().join("\n").as_bytes())?;

		if let Ok(removed_objects) = gc_res {
			file.write_all(format!("\nremoved objects: {}\n", removed_objects.len()).as_bytes())?;
			file.write_all(removed_objects.iter().map(|o| format!("{o}\n")).collect::<Vec<_>>().join("\n").as_bytes())?;
		}
		Ok(())
	}

	fn handle_gc_result(&self, gc_res: Result<IndexSet<Oid>>, bad_objects: Vec<BadObject>, last_gc: Option<GcLog>) -> Result<()> {
		if gc_res.is_err() || !bad_objects.is_empty() {
			let inner = gc_res.err().into_iter().find_map(|e| match e {
				crate::error::Error::Git(e) => Some(e),
				_ => None,
			});

			let err = HealthcheckError {
				inner,
				bad_objects: if bad_objects.is_empty() { None } else { Some(bad_objects) },
				prev_log: last_gc,
			};

			return Err(crate::error::Error::Healthcheck(err));
		}

		Ok(())
	}
}
