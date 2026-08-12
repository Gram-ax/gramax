use super::dto::FsEvent;
use super::dto::FsEventKind;

/// Coalesce Removed(X) + Created(Y) pairs within one debounce batch into Renamed{from:X,to:Y}.
/// Linux/Windows notify backends often don't emit RenameMode::Both, so we infer here.
/// Pairs by basename when possible (e.g. move across directories), otherwise by encounter order.
pub fn coalesce_renames(events: Vec<FsEvent>) -> Vec<FsEvent> {
	if events.len() < 2 {
		return events;
	}

	let mut removed: Vec<usize> = Vec::new();
	let mut created: Vec<usize> = Vec::new();
	for (i, e) in events.iter().enumerate() {
		match e.kind {
			FsEventKind::Removed => removed.push(i),
			FsEventKind::Created => created.push(i),
			_ => {}
		}
	}

	if removed.is_empty() || created.is_empty() {
		return events;
	}

	let basename = |p: &str| p.rsplit('/').next().unwrap_or(p).to_string();

	// Pair each Removed to a Created. Prefer same-basename match; fall back to positional order.
	let mut pairs: Vec<(usize, usize)> = Vec::new();
	let mut consumed_created = std::collections::HashSet::<usize>::new();

	for &ri in &removed {
		let from_base = basename(&events[ri].rel_path);
		let by_name = created.iter().find(|&&ci| !consumed_created.contains(&ci) && basename(&events[ci].rel_path) == from_base);
		let chosen = by_name.copied().or_else(|| created.iter().find(|&&ci| !consumed_created.contains(&ci)).copied());
		if let Some(ci) = chosen {
			consumed_created.insert(ci);
			pairs.push((ri, ci));
		}
	}

	if pairs.is_empty() {
		return events;
	}

	let renamed_at: std::collections::HashMap<usize, String> =
		pairs.iter().map(|(ri, ci)| (*ci, events[*ri].rel_path.clone())).collect();
	let skip: std::collections::HashSet<usize> = pairs.iter().map(|(ri, _)| *ri).collect();

	let mut out = Vec::with_capacity(events.len() - pairs.len());
	for (i, e) in events.into_iter().enumerate() {
		if skip.contains(&i) {
			continue;
		}
		if let Some(from) = renamed_at.get(&i) {
			out.push(FsEvent { rel_path: e.rel_path, kind: FsEventKind::Renamed { from: from.clone() } });
			continue;
		}
		out.push(e);
	}
	out
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn coalesces_remove_create_pair_into_rename() {
		let events = vec![
			FsEvent { rel_path: "old.md".into(), kind: FsEventKind::Removed },
			FsEvent { rel_path: "new.md".into(), kind: FsEventKind::Created },
		];
		let out = coalesce_renames(events);
		assert_eq!(out.len(), 1);
		match &out[0].kind {
			FsEventKind::Renamed { from } => {
				assert_eq!(from, "old.md");
				assert_eq!(out[0].rel_path, "new.md");
			}
			other => panic!("expected rename, got {other:?}"),
		}
	}

	#[test]
	fn leaves_solo_remove_untouched() {
		let events = vec![FsEvent { rel_path: "x.md".into(), kind: FsEventKind::Removed }];
		assert!(matches!(coalesce_renames(events)[0].kind, FsEventKind::Removed));
	}

	#[test]
	fn leaves_modify_only_untouched() {
		let events = vec![FsEvent { rel_path: "x.md".into(), kind: FsEventKind::Modified }];
		assert!(matches!(coalesce_renames(events)[0].kind, FsEventKind::Modified));
	}

	#[test]
	fn coalesces_multiple_pairs_in_one_batch() {
		let events = vec![
			FsEvent { rel_path: "a-old.md".into(), kind: FsEventKind::Removed },
			FsEvent { rel_path: "b-old.md".into(), kind: FsEventKind::Removed },
			FsEvent { rel_path: "a-new.md".into(), kind: FsEventKind::Created },
			FsEvent { rel_path: "b-new.md".into(), kind: FsEventKind::Created },
		];
		let out = coalesce_renames(events);
		assert_eq!(out.len(), 2);
		assert!(out.iter().all(|e| matches!(e.kind, FsEventKind::Renamed { .. })));
	}

	#[test]
	fn coalesces_cross_dir_move_by_basename() {
		let events = vec![
			FsEvent { rel_path: "a/x.md".into(), kind: FsEventKind::Removed },
			FsEvent { rel_path: "b/x.md".into(), kind: FsEventKind::Created },
		];
		let out = coalesce_renames(events);
		assert_eq!(out.len(), 1);
		match &out[0].kind {
			FsEventKind::Renamed { from } => {
				assert_eq!(from, "a/x.md");
				assert_eq!(out[0].rel_path, "b/x.md");
			}
			other => panic!("expected rename, got {other:?}"),
		}
	}

	#[test]
	fn preserves_other_events_around_pair() {
		let events = vec![
			FsEvent { rel_path: "m.md".into(), kind: FsEventKind::Modified },
			FsEvent { rel_path: "old.md".into(), kind: FsEventKind::Removed },
			FsEvent { rel_path: "new.md".into(), kind: FsEventKind::Created },
		];
		let out = coalesce_renames(events);
		assert_eq!(out.len(), 2);
		assert!(matches!(out[0].kind, FsEventKind::Modified));
		assert!(matches!(out[1].kind, FsEventKind::Renamed { .. }));
	}
}
