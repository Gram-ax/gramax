mod common;

use test_utils::*;

use common::fixture;
use common::opts;
use common::Fixture;

use gramaxcore::scan::workspace::WorkspaceScanner;

// known_workspace_paths --------------------------------------------------------

#[rstest]
fn known_workspace_paths_skips_nested_descendant(fixture: Fixture) {
	fixture.file("outer/inner/ws/docroot.yaml", "title: inner\n");
	fixture.file("plain/docroot.yaml", "title: plain\n");

	let mut o = opts();
	o.known_workspace_paths = vec!["outer/inner/ws".into()];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["plain"]);
}

#[rstest]
fn known_workspace_paths_skips_self(fixture: Fixture) {
	fixture.file("ws/docroot.yaml", "title: self\n");
	fixture.file("plain/docroot.yaml", "title: plain\n");

	let mut o = opts();
	o.known_workspace_paths = vec!["ws".into()];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["plain"]);
}

#[rstest]
fn known_workspace_paths_keeps_siblings(fixture: Fixture) {
	fixture.file("a/docroot.yaml", "");
	fixture.file("b/docroot.yaml", "");

	let mut o = opts();
	o.known_workspace_paths = vec!["other/elsewhere".into()];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	let names: Vec<_> = entries.iter().map(|e| e.name.clone()).collect();
	assert_eq!(names, vec!["a", "b"]);
}

#[rstest]
fn known_workspace_paths_empty_keeps_all(fixture: Fixture) {
	fixture.file("a/docroot.yaml", "");
	fixture.file("b/docroot.yaml", "");

	let o = opts();
	assert!(o.known_workspace_paths.is_empty());

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	assert_eq!(entries.len(), 2);
}

#[rstest]
fn known_workspace_paths_multiple_entries(fixture: Fixture) {
	fixture.file("a/docroot.yaml", "");
	fixture.file("b/docroot.yaml", "");
	fixture.file("c/docroot.yaml", "");

	let mut o = opts();
	o.known_workspace_paths = vec!["a".into(), "c".into()];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["b"]);
}

#[rstest]
fn known_workspace_paths_accepts_absolute(fixture: Fixture) {
	fixture.file("projects/readme.md", "");
	fixture.file("catalog-ok/docroot.yaml", "");

	let mut o = opts();
	let abs_wp = fixture.root.join("projects").join("workspace-b").to_string_lossy().into_owned();
	o.known_workspace_paths = vec![abs_wp];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["catalog-ok"]);
}

#[rstest]
fn scan_returns_empty_when_root_missing(fixture: Fixture) {
	let o = opts();
	let entries = WorkspaceScanner::new(&fixture.fs, Path::new("does-not-exist"), &o).scan_workspace().unwrap();
	assert!(entries.is_empty());
}

// catalog_props parsing --------------------------------------------------------

#[rstest]
fn catalog_props_preserves_scalar_types(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "title: hello\ncount: 42\nactive: true\nratio: 1.5\n");

	let entries = fixture.scan(&opts());
	let props = &entries[0].catalog_props;
	assert_eq!(props["title"], "hello");
	assert_eq!(props["count"], 42);
	assert_eq!(props["active"], true);
	assert_eq!(props["ratio"], 1.5);
}

#[rstest]
fn catalog_props_preserves_array(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "tags:\n  - rust\n  - core\n  - fs\n");

	let entries = fixture.scan(&opts());
	let tags = entries[0].catalog_props["tags"].as_array().unwrap();
	let strs: Vec<_> = tags.iter().map(|v| v.as_str().unwrap()).collect();
	assert_eq!(strs, vec!["rust", "core", "fs"]);
}

#[rstest]
fn catalog_props_preserves_nested_object(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "meta:\n  author: pavel\n  version: 2\n");

	let entries = fixture.scan(&opts());
	let meta = &entries[0].catalog_props["meta"];
	assert_eq!(meta["author"], "pavel");
	assert_eq!(meta["version"], 2);
}

#[rstest]
fn catalog_props_null_field_present(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "title: t\nsubtitle: ~\n");

	let entries = fixture.scan(&opts());
	let props = &entries[0].catalog_props;
	assert!(props.get("subtitle").is_some());
	assert!(props["subtitle"].is_null());
}

#[rstest]
fn catalog_props_empty_yaml_is_empty_object(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "");

	let entries = fixture.scan(&opts());
	assert!(entries[0].catalog_props.as_object().unwrap().is_empty());
}

// docroot_filenames priority --------------------------------------------------

#[rstest]
fn docroot_filenames_first_match_wins(fixture: Fixture) {
	fixture.file("cat/.docroot.yaml", "title: long\n");
	fixture.file("cat/.docroot.yml", "title: short\n");

	let mut o = opts();
	o.docroot_filenames = vec![".docroot.yaml".into(), ".docroot.yml".into()];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	assert_eq!(entries[0].docroot_rel.as_deref(), Some(Path::new(".docroot.yaml")));
	assert_eq!(entries[0].catalog_props["title"], "long");
}

#[rstest]
fn docroot_filenames_falls_back_to_alternate(fixture: Fixture) {
	fixture.file("cat/.docroot.yml", "title: yml\n");

	let mut o = opts();
	o.docroot_filenames = vec![".docroot.yaml".into(), ".docroot.yml".into()];

	let entries = WorkspaceScanner::new(&fixture.fs, Path::new(""), &o).scan_workspace().unwrap();
	assert_eq!(entries[0].docroot_rel.as_deref(), Some(Path::new(".docroot.yml")));
	assert_eq!(entries[0].catalog_props["title"], "yml");
}

#[rstest]
fn docroot_shallower_preferred_over_deeper(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "title: shallow\n");
	fixture.file("cat/deep/docroot.yaml", "title: deep\n");

	let entries = fixture.scan(&opts());
	assert_eq!(entries[0].docroot_rel.as_deref(), Some(Path::new("docroot.yaml")));
	assert_eq!(entries[0].catalog_props["title"], "shallow");
}

// workspace_yaml skip ---------------------------------------------------------

#[rstest]
fn workspace_yaml_must_be_at_entry_root(fixture: Fixture) {
	fixture.file("cat/sub/workspace.yaml", "");
	fixture.file("cat/docroot.yaml", "");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["cat"]);
}

#[rstest]
fn workspace_yaml_at_entry_root_skipped(fixture: Fixture) {
	fixture.file("cat/workspace.yaml", "");
	fixture.file("plain/docroot.yaml", "");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["plain"]);
}

// Filtering -------------------------------------------------------------------

#[rstest]
fn files_at_root_are_ignored(fixture: Fixture) {
	fixture.file("loose.md", "# stray");
	fixture.file("README.md", "");
	fixture.file("cat/docroot.yaml", "");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["cat"]);
}

#[rstest]
fn entry_without_docroot_still_returned(fixture: Fixture) {
	fixture.dir("a");
	fixture.dir("b");
	fixture.file("c/docroot.yaml", "title: c\n");

	let entries = fixture.scan(&opts());
	let names: Vec<_> = entries.iter().map(|e| e.name.as_str()).collect();
	assert_eq!(names, vec!["a", "b", "c"]);
	assert!(entries[0].docroot_rel.is_none());
	assert!(entries[1].docroot_rel.is_none());
	assert_eq!(entries[2].docroot_rel.as_deref(), Some(Path::new("docroot.yaml")));
}
