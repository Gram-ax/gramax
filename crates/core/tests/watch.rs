use std::sync::Arc;
use std::sync::Mutex;
use std::time::Duration;

use gramaxcore::watch::watch_workspace;
use gramaxcore::watch::FsEvent;
use gramaxcore::watch::FsEventKind;
use gramaxcore::watch::WatchOpts;
use gramaxfs::commands::FsScope;
use tempfile::TempDir;

type Store = Arc<Mutex<Vec<FsEvent>>>;

fn collector() -> (Store, impl Fn(Vec<FsEvent>) + Send + Sync + 'static) {
	let store: Store = Arc::new(Mutex::new(Vec::new()));
	let store2 = store.clone();
	let push = move |batch: Vec<FsEvent>| {
		store2.lock().unwrap().extend(batch);
	};
	(store, push)
}

fn wait_for<F: Fn() -> bool>(check: F, timeout: Duration) -> bool {
	let start = std::time::Instant::now();
	while start.elapsed() < timeout {
		if check() {
			return true;
		}
		std::thread::sleep(Duration::from_millis(20));
	}
	false
}

fn opts_fast() -> WatchOpts {
	WatchOpts { excludes: vec![".git".into()], debounce_ms: 50 }
}

fn scope_for(dir: &std::path::Path) -> FsScope {
	FsScope::Disk { root: dir.to_path_buf() }
}

#[test]
fn watch_emits_renamed_on_rename() {
	let tmp = TempDir::new().unwrap();
	let from = tmp.path().join("old.md");
	let to = tmp.path().join("new.md");
	std::fs::write(&from, "x").unwrap();
	std::thread::sleep(Duration::from_millis(400));

	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(300));
	events.lock().unwrap().clear();

	std::fs::rename(&from, &to).unwrap();
	std::thread::sleep(Duration::from_millis(800));

	let evs = events.lock().unwrap();
	let renamed = evs.iter().any(|e| match &e.kind {
		FsEventKind::Renamed { from } => from == "old.md" && e.rel_path == "new.md",
		_ => false,
	});
	let pair = evs.iter().any(|e| matches!(e.kind, FsEventKind::Removed) && e.rel_path == "old.md")
		&& evs.iter().any(|e| matches!(e.kind, FsEventKind::Created) && e.rel_path == "new.md");
	// macOS FSEvents does not report Remove for the source path of a rename within the watched tree;
	// only Created("new.md") surfaces. Accept that as a valid outcome.
	let created_only = cfg!(target_os = "macos")
		&& evs.iter().any(|e| matches!(e.kind, FsEventKind::Created) && e.rel_path == "new.md");
	assert!(renamed || pair || created_only, "expected rename, pair, or macos-created; got {evs:?}");
	drop(evs);
	handle.stop();
}

#[test]
fn watch_emits_modified_on_overwrite() {
	let tmp = TempDir::new().unwrap();
	let file = tmp.path().join("a.md");
	std::fs::write(&file, "v1").unwrap();
	std::thread::sleep(Duration::from_millis(200));

	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(100));

	std::fs::write(&file, "v2").unwrap();

	assert!(
		wait_for(
			|| events
				.lock()
				.unwrap()
				.iter()
				.any(|e| e.rel_path == "a.md" && matches!(e.kind, FsEventKind::Modified | FsEventKind::Created)),
			Duration::from_millis(3000)
		),
		"no modify event, got: {:?}",
		events.lock().unwrap()
	);
	handle.stop();
}

#[test]
fn watch_emits_removed_on_delete() {
	let tmp = TempDir::new().unwrap();
	let file = tmp.path().join("a.md");
	std::fs::write(&file, "x").unwrap();
	std::thread::sleep(Duration::from_millis(800));

	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(400));
	events.lock().unwrap().clear();

	std::fs::remove_file(&file).unwrap();

	assert!(
		wait_for(
			|| events.lock().unwrap().iter().any(|e| e.rel_path == "a.md" && matches!(e.kind, FsEventKind::Removed)),
			Duration::from_millis(3000)
		),
		"no remove event, got: {:?}",
		events.lock().unwrap()
	);
	handle.stop();
}

#[test]
fn watch_debounce_coalesces_burst() {
	let tmp = TempDir::new().unwrap();
	let file = tmp.path().join("burst.md");
	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(100));

	for i in 0..10 {
		std::fs::write(&file, format!("{i}")).unwrap();
	}

	std::thread::sleep(Duration::from_millis(800));
	let count = events
		.lock()
		.unwrap()
		.iter()
		.filter(|e| e.rel_path == "burst.md" && matches!(e.kind, FsEventKind::Modified | FsEventKind::Created))
		.count();
	assert!(count <= 3, "expected debounce coalesce, got {count}");
	handle.stop();
}

#[test]
fn watch_excludes_filters_dot_git() {
	let tmp = TempDir::new().unwrap();
	std::fs::create_dir(tmp.path().join(".git")).unwrap();

	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(100));

	std::fs::write(tmp.path().join(".git/HEAD"), "ref:").unwrap();
	std::thread::sleep(Duration::from_millis(500));

	assert!(events.lock().unwrap().iter().all(|e| !e.rel_path.starts_with(".git")));
	handle.stop();
}

#[test]
fn watch_does_not_follow_symlinks() {
	let tmp = TempDir::new().unwrap();
	let outside = TempDir::new().unwrap();
	std::fs::write(outside.path().join("o.md"), "x").unwrap();

	#[cfg(unix)]
	std::os::unix::fs::symlink(outside.path(), tmp.path().join("link")).unwrap();

	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(100));

	std::fs::write(outside.path().join("inside.md"), "y").unwrap();
	std::thread::sleep(Duration::from_millis(500));

	assert!(events.lock().unwrap().iter().all(|e| !e.rel_path.starts_with("link/")));
	handle.stop();
}

#[test]
fn watch_emits_create_and_delete_in_order() {
	let tmp = TempDir::new().unwrap();
	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(100));

	let f = tmp.path().join("seq.md");
	std::fs::write(&f, "x").unwrap();
	std::thread::sleep(Duration::from_millis(400));
	std::fs::remove_file(&f).unwrap();
	std::thread::sleep(Duration::from_millis(500));

	let seen: Vec<_> = events.lock().unwrap().iter().filter(|e| e.rel_path == "seq.md").map(|e| e.kind.clone()).collect();
	let cpos = seen.iter().position(|k| matches!(k, FsEventKind::Created | FsEventKind::Modified));
	let rpos = seen.iter().position(|k| matches!(k, FsEventKind::Removed));
	assert!(cpos.is_some() && rpos.is_some(), "missing create or remove: {seen:?}");
	assert!(cpos.unwrap() < rpos.unwrap(), "create after remove: {seen:?}");
	handle.stop();
}

#[test]
fn watch_emits_created_on_new_file() {
	let tmp = TempDir::new().unwrap();
	let (events, push) = collector();
	let handle = watch_workspace(scope_for(tmp.path()), opts_fast(), push).unwrap();
	std::thread::sleep(Duration::from_millis(100));

	std::fs::write(tmp.path().join("hello.md"), "# hi").unwrap();

	assert!(
		wait_for(
			|| events
				.lock()
				.unwrap()
				.iter()
				.any(|e| e.rel_path == "hello.md" && matches!(e.kind, FsEventKind::Created | FsEventKind::Modified)),
			Duration::from_millis(3000)
		),
		"no create event, got: {:?}",
		events.lock().unwrap()
	);

	handle.stop();
}

