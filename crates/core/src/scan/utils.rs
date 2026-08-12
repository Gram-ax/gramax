use std::collections::VecDeque;
use std::path::Path;
use std::path::PathBuf;

use gramaxfs::backend::Fs;

use tracing::warn;

use crate::scan::workspace::ScanOpts;
use crate::Result;

pub(crate) fn empty_object() -> serde_json::Value {
	serde_json::Value::Object(serde_json::Map::new())
}

pub(crate) fn yaml_to_json_or_empty(bytes: &[u8]) -> Result<serde_json::Value> {
	let yaml: serde_yml::Value = serde_yml::from_slice(bytes)?;
	let json = serde_json::to_value(yaml)?;

	if !json.is_object() {
		Ok(empty_object())
	} else {
		Ok(json)
	}
}

pub(crate) fn find_docroot(fp: &dyn Fs, dir: &Path, opts: &ScanOpts) -> Option<PathBuf> {
	let mut queue: VecDeque<(PathBuf, u8)> = VecDeque::new();
	queue.push_back((dir.to_path_buf(), 0));

	while let Some((dir, depth)) = queue.pop_front() {
		for name in &opts.docroot_filenames {
			let candidate = dir.join(name);
			if fp.exists(&candidate).unwrap_or(false) {
				return Some(candidate);
			}
		}

		if depth.saturating_add(1) >= opts.docroot_search_depth {
			continue;
		}

		let entries = match fp.read_dir_stats(&dir) {
			Ok(e) => e,
			Err(_) => continue,
		};

		let mut subdirs: Vec<_> = entries
			.into_iter()
			.filter(|e| e.stat.is_dir() && !opts.is_excluded_dir(&e.name))
			.collect();

		subdirs.sort_by(|a, b| a.name.cmp(&b.name));
		for e in subdirs {
			queue.push_back((dir.join(&e.name), depth + 1));
		}
	}

	None
}

pub(crate) fn read_docroot_props(fp: &dyn Fs, docroot_abs: Option<&Path>) -> serde_json::Value {
	let Some(p) = docroot_abs else { return empty_object() };
	match fp.read(p) {
		Ok(bytes) => yaml_to_json_or_empty(&bytes).unwrap_or_else(|e| {
			warn!(path = %p.display(), error = %e, "docroot yaml parse failed");
			empty_object()
		}),
		Err(e) => {
			warn!(path = %p.display(), error = ?e, "docroot read failed");
			empty_object()
		}
	}
}
