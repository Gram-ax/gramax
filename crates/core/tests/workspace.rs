mod common;

use test_utils::*;

use common::fixture;
use common::opts;
use common::Fixture;

use gramaxcore::scan::workspace::WorkspaceScanner;

// Core happy paths -------------------------------------------------------------

#[rstest]
fn empty_root_returns_empty(fixture: Fixture) {
	let entries = fixture.scan(&opts());
	assert!(entries.is_empty());
}

#[rstest]
fn single_catalog_with_docroot_at_depth_1(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "title: My Catalog\n");

	let entries = fixture.scan(&opts());
	assert_eq!(entries.len(), 1);
	let e = &entries[0];
	assert_eq!(e.name, "cat");
	assert_eq!(e.rel_path, Path::new("cat"));
	assert_eq!(e.docroot_rel.as_deref(), Some(Path::new("docroot.yaml")));
	assert_eq!(e.catalog_props["title"], "My Catalog");
}

#[rstest]
fn docroot_at_max_depth_is_found_beyond_is_not(fixture: Fixture) {
	fixture.file("cat5/a/b/c/d/docroot.yaml", "title: deep5\n");
	fixture.file("cat6/a/b/c/d/e/docroot.yaml", "title: deep6\n");

	let entries = fixture.scan(&opts());
	let by_name: std::collections::HashMap<_, _> = entries.iter().map(|e| (e.name.clone(), e)).collect();

	assert_eq!(by_name["cat5"].docroot_rel.as_deref(), Some(Path::new("a/b/c/d/docroot.yaml")));
	assert!(by_name["cat6"].docroot_rel.is_none());
	assert!(by_name["cat6"].catalog_props.as_object().unwrap().is_empty());
}

#[rstest]
fn multiple_catalogs_collected(fixture: Fixture) {
	for i in 0..20 {
		fixture.file(&format!("cat{i:02}/docroot.yaml"), &format!("title: c{i}\n"));
	}

	let entries = fixture.scan(&opts());
	assert_eq!(entries.len(), 20);
	let names: std::collections::HashSet<_> = entries.iter().map(|e| e.name.clone()).collect();
	for i in 0..20 {
		assert!(names.contains(&format!("cat{i:02}")));
	}
}

#[rstest]
fn excluded_dirs_skipped(fixture: Fixture) {
	fixture.file(".git/docroot.yaml", "");
	fixture.file("node_modules/docroot.yaml", "");
	fixture.file(".storage/docroot.yaml", "");
	fixture.file("ok/docroot.yaml", "title: ok\n");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["ok"]);
}

// Workspace nesting ------------------------------------------------------------

#[rstest]
fn nested_workspace_yaml_dirs_skipped(fixture: Fixture) {
	fixture.file("outer/workspace.yaml", "");
	fixture.file("outer/inner/docroot.yaml", "title: inner\n");
	fixture.file("plain/docroot.yaml", "title: plain\n");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["plain"]);
}

#[rstest]
fn workspace_config_filename_overridable(fixture: Fixture) {
	fixture.file("outer/space.yml", "");
	fixture.file("outer/docroot.yaml", "");
	fixture.file("plain/docroot.yaml", "");

	let mut o = opts();
	o.workspace_config_filename = "space.yml".into();
	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["plain"]);
}

// Edge cases ------------------------------------------------------------------

#[rstest]
fn malformed_docroot_yaml_returns_empty_props(fixture: Fixture) {
	fixture.file("broken/docroot.yaml", ": : : not yaml\n  - [\n");

	let entries = fixture.scan(&opts());
	assert_eq!(entries.len(), 1);
	let e = &entries[0];
	assert_eq!(e.docroot_rel.as_deref(), Some(Path::new("docroot.yaml")));
	assert!(e.catalog_props.is_object());
	assert!(e.catalog_props.as_object().unwrap().is_empty());
}

#[rstest]
fn yaml_root_scalar_returns_empty_props(fixture: Fixture) {
	fixture.file("scalar/docroot.yaml", "just-a-string\n");

	let entries = fixture.scan(&opts());
	assert_eq!(entries.len(), 1);
	assert!(entries[0].catalog_props.as_object().unwrap().is_empty());
}

#[rstest]
fn docroot_filename_overridable(fixture: Fixture) {
	fixture.file("cat/custom.yaml", "title: custom\n");

	let mut o = opts();
	o.docroot_filenames = vec!["custom.yaml".into()];
	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	assert_eq!(entries.len(), 1);
	assert_eq!(entries[0].docroot_rel.as_deref(), Some(Path::new("custom.yaml")));
	assert_eq!(entries[0].catalog_props["title"], "custom");
}

#[rstest]
fn cyrillic_path_names(fixture: Fixture) {
	fixture.file("каталог/docroot.yaml", "title: \"Заголовок\"\n");

	let entries = fixture.scan(&opts());
	assert_eq!(entries.len(), 1);
	let e = &entries[0];
	assert_eq!(e.name, "каталог");
	assert_eq!(e.rel_path, Path::new("каталог"));
	assert_eq!(e.catalog_props["title"], "Заголовок");
}

#[rstest]
fn hidden_dot_dirs_excluded_without_explicit_opts(fixture: Fixture) {
	fixture.file(".hidden/docroot.yaml", "");
	fixture.file(".vscode/docroot.yaml", "");
	fixture.file("visible/docroot.yaml", "");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["visible"]);
}

#[rstest]
fn missing_docroot_returns_entry_with_empty_props(fixture: Fixture) {
	fixture.dir("no-docroot");

	let entries = fixture.scan(&opts());
	assert_eq!(entries.len(), 1);
	assert_eq!(entries[0].name, "no-docroot");
	assert!(entries[0].docroot_rel.is_none());
	assert!(entries[0].catalog_props.as_object().unwrap().is_empty());
}

#[rstest]
fn excluded_dirs_skipped_inside_bfs(fixture: Fixture) {
	fixture.file("cat/node_modules/docroot.yaml", "title: should-not-match\n");
	fixture.file("cat/real/docroot.yaml", "title: real\n");

	let entries = fixture.scan(&opts());
	assert_eq!(entries[0].name, "cat");
	assert_eq!(entries[0].docroot_rel.as_deref(), Some(Path::new("real/docroot.yaml")));
	assert_eq!(entries[0].catalog_props["title"], "real");
}

#[cfg(unix)]
#[rstest]
fn symlink_cycle_does_not_hang(fixture: Fixture) {
	use std::os::unix::fs::symlink;
	use std::time::Duration;
	use std::time::Instant;

	fixture.dir("loop/a");
	fixture.dir("loop/b");
	symlink(fixture.root.join("loop/a"), fixture.root.join("loop/b/back")).unwrap();
	symlink(fixture.root.join("loop/b"), fixture.root.join("loop/a/back")).unwrap();

	let started = Instant::now();
	let entries = fixture.scan(&opts());
	assert!(started.elapsed() < Duration::from_secs(5), "scan hung on symlink cycle");
	let names: std::collections::HashSet<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert!(names.contains("loop"));
}

// Concurrency / determinism ---------------------------------------------------

#[rstest]
fn result_order_is_alphabetical_by_name(fixture: Fixture) {
	fixture.file("zebra/docroot.yaml", "");
	fixture.file("apple/docroot.yaml", "");
	fixture.file("mango/docroot.yaml", "");

	let names: Vec<_> = fixture.scan(&opts()).into_iter().map(|e| e.name).collect();
	assert_eq!(names, vec!["apple", "mango", "zebra"]);
}

#[rstest]
fn two_runs_produce_identical_output(fixture: Fixture) {
	for n in ["a", "b", "c", "d", "e"] {
		fixture.file(&format!("{n}/docroot.yaml"), &format!("title: {n}\n"));
	}

	let run1 = serde_json::to_string(&fixture.scan(&opts())).unwrap();
	let run2 = serde_json::to_string(&fixture.scan(&opts())).unwrap();
	assert_eq!(run1, run2);
}

// Serialization ---------------------------------------------------------------

#[rstest]
fn dto_json_shape(fixture: Fixture) {
	fixture.file("with-docroot/docroot.yaml", "title: t\nicon: i\n");
	fixture.dir("no-docroot");
	fixture.file("nested/workspace.yaml", "");
	fixture.file("nested/sub/docroot.yaml", "title: sub\n");

	let entries = fixture.scan(&opts());
	let actual = serde_json::to_value(&entries).unwrap();
	let expected = serde_json::json!([
		{
			"relPath": "no-docroot",
			"name": "no-docroot",
			"docrootRel": null,
			"catalogProps": {}
		},
		{
			"relPath": "with-docroot",
			"name": "with-docroot",
			"docrootRel": "docroot.yaml",
			"catalogProps": { "icon": "i", "title": "t" }
		}
	]);
	assert_eq!(actual, expected);
}
