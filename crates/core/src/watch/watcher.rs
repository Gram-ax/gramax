use std::collections::HashSet;
use std::path::Path;
use std::path::PathBuf;
use std::sync::mpsc;
use std::time::Duration;

use gramaxfs::commands::FsScope;

use notify_debouncer_full::new_debouncer;
use notify_debouncer_full::notify::event::ModifyKind;
use notify_debouncer_full::notify::event::RenameMode;
use notify_debouncer_full::notify::EventKind;
use notify_debouncer_full::notify::RecursiveMode;
use notify_debouncer_full::DebounceEventResult;
use notify_debouncer_full::DebouncedEvent;

use super::dto::FsEvent;
use super::dto::FsEventKind;
use super::dto::WatchOpts;
use super::rename::coalesce_renames;

use crate::Result;

pub struct WatchHandle {
	_stop: Option<Box<dyn FnOnce() + Send>>,
}

impl WatchHandle {
	pub fn stop(mut self) {
		if let Some(f) = self._stop.take() {
			f();
		}
	}
}

pub fn watch_workspace<F>(scope: FsScope, opts: WatchOpts, on_batch: F) -> Result<WatchHandle>
where
	F: Fn(Vec<FsEvent>) + Send + Sync + 'static,
{
	let FsScope::Disk { root } = scope else {
		return Err(crate::Error::Other("unsupported scope; only disk scopes are supported".to_string()));
	};

	let root_owned = root.canonicalize().map_err(|e| crate::Error::Other(format!("canonicalize root: {e}")))?;
	let root_for_closure = root_owned.clone();
	let excludes = opts.excludes.clone();

	let mut debouncer = new_debouncer(Duration::from_millis(opts.debounce_ms), None, move |res: DebounceEventResult| match res {
		Ok(events) => {
			let mapped = events
				.into_iter()
				.flat_map(|e| map_event(&root_for_closure, &excludes, e))
				.collect::<Vec<_>>();
			let coalesced = dedupe(coalesce_renames(mapped));
			if !coalesced.is_empty() {
				on_batch(coalesced);
			}
		}
		Err(errs) => {
			for err in errs {
				tracing::warn!(error = ?err, "notify error");
			}
		}
	})
	.map_err(|e| crate::Error::Other(format!("notify init: {e}")))?;

	let (stop_tx, stop_rx) = mpsc::channel::<()>();

	std::thread::spawn(move || {
		if let Err(err) = debouncer.watch(&root_owned, RecursiveMode::Recursive) {
			tracing::error!(err = ?err, "failed to init watcher");
			return;
		}

		let _ = stop_rx.recv();
		drop(debouncer);
	});

	Ok(WatchHandle {
		_stop: Some(Box::new(move || {
			let _ = stop_tx.send(());
		})),
	})
}

fn dedupe(events: Vec<FsEvent>) -> Vec<FsEvent> {
	let mut seen = HashSet::new();
	events.into_iter().filter(|e| seen.insert(e.clone())).collect()
}

fn is_excluded(rel: &Path, excludes: &[String]) -> bool {
	for comp in rel.components() {
		let s = comp.as_os_str().to_string_lossy();
		if excludes.iter().any(|x| x == s.as_ref()) {
			return true;
		}
	}
	false
}

fn to_rel(root: &Path, abs: &Path) -> Option<PathBuf> {
	abs.strip_prefix(root).ok().map(|p| p.to_path_buf())
}

fn rel_to_string(rel: &Path) -> String {
	rel.to_string_lossy().replace('\\', "/")
}

fn map_event(root: &Path, excludes: &[String], ev: DebouncedEvent) -> Vec<FsEvent> {
	let event = ev.event;

	if let EventKind::Modify(ModifyKind::Name(RenameMode::Both)) = event.kind {
		if event.paths.len() == 2 {
			let from = to_rel(root, &event.paths[0]);
			let to = to_rel(root, &event.paths[1]);
			match (from, to) {
				(Some(from), Some(to)) => {
					if is_excluded(&from, excludes) || is_excluded(&to, excludes) {
						return vec![];
					}
					return vec![FsEvent {
						rel_path: rel_to_string(&to),
						kind: FsEventKind::Renamed { from: rel_to_string(&from) },
					}];
				}
				(Some(from), None) => {
					if is_excluded(&from, excludes) {
						return vec![];
					}
					return vec![FsEvent {
						rel_path: rel_to_string(&from),
						kind: FsEventKind::Removed,
					}];
				}
				(None, Some(to)) => {
					if is_excluded(&to, excludes) {
						return vec![];
					}
					return vec![FsEvent {
						rel_path: rel_to_string(&to),
						kind: FsEventKind::Created,
					}];
				}
				_ => return vec![],
			}
		}
		return vec![];
	}

	let kind = match event.kind {
		EventKind::Create(_) => FsEventKind::Created,
		EventKind::Modify(ModifyKind::Name(RenameMode::From)) => FsEventKind::Removed,
		EventKind::Modify(ModifyKind::Name(RenameMode::To)) => FsEventKind::Created,
		EventKind::Modify(_) => FsEventKind::Modified,
		EventKind::Remove(_) => FsEventKind::Removed,
		_ => return vec![],
	};

	event
		.paths
		.iter()
		.filter_map(|abs| {
			let rel = to_rel(root, abs)?;
			if is_excluded(&rel, excludes) {
				return None;
			}
			Some(FsEvent {
				rel_path: rel_to_string(&rel),
				kind: kind.clone(),
			})
		})
		.collect()
}
