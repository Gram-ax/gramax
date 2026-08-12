mod common;

use test_utils::*;

use common::fixture;
use common::opts;
use common::Fixture;

use gramaxcore::scan::catalog::CatalogScanner;
use gramaxcore::scan::catalog::CatalogTreeDto;
use gramaxcore::scan::catalog::NodeDto;

fn scan(fixture: &Fixture, catalog_rel: &str, docroot_rel: Option<&str>) -> CatalogTreeDto {
	let cat = Path::new(catalog_rel).to_path_buf();
	let docroot = docroot_rel.map(Path::new);
	CatalogScanner::new(&fixture.fs, &cat, docroot, &opts()).scan().unwrap()
}

#[allow(dead_code)]
fn children(node: &NodeDto) -> &[NodeDto] {
	match node {
		NodeDto::Category { children, .. } => children,
		_ => panic!("expected Category, got Article"),
	}
}

fn article_rel(node: &NodeDto) -> &Path {
	match node {
		NodeDto::Article { rel_path, .. } => rel_path,
		_ => panic!("expected Article"),
	}
}

fn category_rel(node: &NodeDto) -> &Path {
	match node {
		NodeDto::Category { rel_path, .. } => rel_path,
		_ => panic!("expected Category"),
	}
}

// Happy paths -----------------------------------------------------------------

#[rstest]
fn empty_catalog(fixture: Fixture) {
	fixture.dir("cat");
	let tree = scan(&fixture, "cat", None);
	assert!(tree.children.is_empty());
}

#[rstest]
fn single_article(fixture: Fixture) {
	fixture.file("cat/intro.md", "---\ntitle: Intro\n---\nbody");
	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.children.len(), 1);
	match &tree.children[0] {
		NodeDto::Article {
			rel_path,
			front_matter,
			parse_error,
			..
		} => {
			assert_eq!(rel_path.to_str(), Some("intro.md"));
			assert_eq!(front_matter["title"], "Intro");
			assert!(parse_error.is_none());
		}
		_ => panic!("expected Article"),
	}
}

#[rstest]
fn nested_categories_with_index(fixture: Fixture) {
	fixture.file("cat/sub/category.yaml", "---\ntitle: Sub\n---\nblurb");
	fixture.file("cat/sub/a.md", "---\ntitle: A\n---\n");

	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.children.len(), 1);
	match &tree.children[0] {
		NodeDto::Category {
			directory,
			has_index,
			front_matter,
			children,
			..
		} => {
			assert_eq!(directory.to_str(), Some("sub"));
			assert!(*has_index);
			assert_eq!(front_matter["title"], "Sub");
			let article_rels: Vec<_> = children.iter().map(|n| article_rel(n).to_str().unwrap()).collect();
			assert_eq!(article_rels, vec!["sub/a.md"]);
		}
		_ => panic!("expected Category"),
	}
}

#[rstest]
fn category_without_index_still_walked(fixture: Fixture) {
	fixture.file("cat/sub/a.md", "");
	fixture.file("cat/sub/b.md", "");

	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.children.len(), 1);
	match &tree.children[0] {
		NodeDto::Category {
			directory,
			has_index,
			children,
			..
		} => {
			assert_eq!(directory.to_str(), Some("sub"));
			assert!(!has_index);
			let mut rels: Vec<_> = children.iter().map(|n| article_rel(n).to_str().unwrap().to_string()).collect();
			rels.sort();
			assert_eq!(rels, vec!["sub/a.md", "sub/b.md"]);
		}
		_ => panic!("expected Category"),
	}
}

#[rstest]
fn cyrillic_paths(fixture: Fixture) {
	fixture.file("каталог/статья.md", "---\ntitle: \"Привет\"\n---\nтекст");
	let tree = scan(&fixture, "каталог", None);
	assert_eq!(tree.children.len(), 1);
	match &tree.children[0] {
		NodeDto::Article { rel_path, front_matter, .. } => {
			assert_eq!(rel_path.to_str(), Some("статья.md"));
			assert_eq!(front_matter["title"], "Привет");
		}
		_ => panic!("expected Article"),
	}
}

#[rstest]
fn docroot_props_loaded(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "title: Cat\nicon: 🐱\n");
	let tree = scan(&fixture, "cat", Some("docroot.yaml"));
	assert_eq!(tree.catalog_props["title"], "Cat");
	assert_eq!(tree.docroot_rel.as_deref(), Some(Path::new("docroot.yaml")));
}

#[rstest]
fn docroot_autodetected_when_not_supplied(fixture: Fixture) {
	fixture.file("cat/docroot.yaml", "title: Cat\n");
	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.docroot_rel.as_deref(), Some(Path::new("docroot.yaml")));
	assert_eq!(tree.catalog_props["title"], "Cat");
}

#[rstest]
fn docroot_in_subdir_walks_from_docroot_parent(fixture: Fixture) {
	fixture.file("cat/a/b/docroot.yaml", "title: Nested\n");
	fixture.file("cat/a/b/new-article-2.md", "---\ntitle: Two\n---\n");
	fixture.file("cat/sibling/other.md", "---\ntitle: Other\n---\n");
	fixture.file("cat/root-article.md", "---\ntitle: Root\n---\n");

	let tree = scan(&fixture, "cat", Some("a/b/docroot.yaml"));
	let rels: Vec<_> = tree
		.children
		.iter()
		.map(|n| match n {
			NodeDto::Article { rel_path, .. } => rel_path.to_str().unwrap().to_string(),
			NodeDto::Category { directory, .. } => directory.to_str().unwrap().to_string(),
		})
		.collect();
	assert!(rels.contains(&"a/b/new-article-2.md".to_string()), "got {:?}", rels);
	assert!(!rels.iter().any(|r| r.starts_with("sibling")), "leaked sibling: {:?}", rels);
	assert!(!rels.iter().any(|r| r == "root-article.md"), "leaked root article: {:?}", rels);
}

#[rstest]
fn docroot_in_subdir_autodetected_walks_from_docroot_parent(fixture: Fixture) {
	fixture.file("cat/a/b/docroot.yaml", "title: Nested\n");
	fixture.file("cat/a/b/only.md", "---\ntitle: Only\n---\n");
	fixture.file("cat/outside.md", "---\ntitle: Outside\n---\n");

	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.docroot_rel.as_deref(), Some(Path::new("a/b/docroot.yaml")));
	let rels: Vec<_> = tree
		.children
		.iter()
		.filter_map(|n| match n {
			NodeDto::Article { rel_path, .. } => Some(rel_path.to_str().unwrap().to_string()),
			_ => None,
		})
		.collect();
	assert_eq!(rels, vec!["a/b/only.md".to_string()]);
}

// Edge cases ------------------------------------------------------------------

#[rstest]
fn malformed_frontmatter_yields_parse_error(fixture: Fixture) {
	fixture.file("cat/bad.md", "---\nkey: [unclosed\n---\nbody");

	let tree = scan(&fixture, "cat", None);
	match &tree.children[0] {
		NodeDto::Article {
			parse_error, front_matter, ..
		} => {
			assert!(parse_error.is_some(), "expected parse_error for malformed YAML");
			assert!(front_matter.as_object().unwrap().is_empty());
		}
		_ => panic!("expected Article"),
	}
}

#[rstest]
fn article_without_frontmatter(fixture: Fixture) {
	fixture.file("cat/plain.md", "just a body, no front matter\n");

	let tree = scan(&fixture, "cat", None);
	match &tree.children[0] {
		NodeDto::Article {
			parse_error, front_matter, ..
		} => {
			assert!(parse_error.is_none());
			assert!(front_matter.as_object().unwrap().is_empty());
		}
		_ => panic!("expected Article"),
	}
}

#[rstest]
fn unterminated_frontmatter(fixture: Fixture) {
	fixture.file("cat/runaway.md", "---\ntitle: never closed\n");

	let tree = scan(&fixture, "cat", None);
	match &tree.children[0] {
		NodeDto::Article { parse_error, .. } => {
			assert!(parse_error.is_some());
		}
		_ => panic!("expected Article"),
	}
}

#[rstest]
fn excluded_dirs_skipped(fixture: Fixture) {
	fixture.file("cat/.git/x.md", "");
	fixture.file("cat/node_modules/y.md", "");
	fixture.file("cat/real/z.md", "");

	let tree = scan(&fixture, "cat", None);
	let rels: Vec<_> = tree
		.children
		.iter()
		.map(|n| match n {
			NodeDto::Category { directory, .. } => directory.to_str().unwrap(),
			NodeDto::Article { rel_path, .. } => rel_path.to_str().unwrap(),
		})
		.collect();
	assert!(rels.contains(&"real"));
	assert!(!rels.iter().any(|r| r.starts_with(".git")));
	assert!(!rels.iter().any(|r| r.starts_with("node_modules")));
}

#[rstest]
fn markdown_extension_variants(fixture: Fixture) {
	fixture.file("cat/a.md", "");
	fixture.file("cat/b.markdown", "");
	fixture.file("cat/c.txt", "");

	let tree = scan(&fixture, "cat", None);
	let mut rels: Vec<_> = tree
		.children
		.iter()
		.filter_map(|n| match n {
			NodeDto::Article { rel_path, .. } => Some(rel_path.to_str().unwrap().to_string()),
			_ => None,
		})
		.collect();
	rels.sort();
	assert_eq!(rels, vec!["a.md", "b.markdown"]);
}

// Determinism -----------------------------------------------------------------

#[rstest]
fn determinism_two_scans_identical(fixture: Fixture) {
	fixture.file("cat/sub/category.yaml", "---\ntitle: Sub\n---\n");
	fixture.file("cat/sub/a.md", "---\ntitle: A\n---\n");
	fixture.file("cat/sub/b.md", "---\ntitle: B\n---\n");
	fixture.file("cat/top.md", "---\ntitle: T\n---\n");

	let one = serde_json::to_string(&scan(&fixture, "cat", None)).unwrap();
	let two = serde_json::to_string(&scan(&fixture, "cat", None)).unwrap();
	assert_eq!(one, two);
}

#[rstest]
fn children_sorted_alphabetically(fixture: Fixture) {
	fixture.file("cat/zebra.md", "");
	fixture.file("cat/apple.md", "");
	fixture.file("cat/mango.md", "");

	let tree = scan(&fixture, "cat", None);
	let rels: Vec<_> = tree
		.children
		.iter()
		.filter_map(|n| match n {
			NodeDto::Article { rel_path, .. } => Some(rel_path.to_str().unwrap().to_string()),
			_ => None,
		})
		.collect();
	assert_eq!(rels, vec!["apple.md", "mango.md", "zebra.md"]);
}

#[rstest]
fn categories_after_articles_in_children(fixture: Fixture) {
	fixture.file("cat/zzz.md", "");
	fixture.file("cat/aaa/category.yaml", "");

	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.children.len(), 2);
	assert!(matches!(tree.children[0], NodeDto::Article { .. }));
	let _ = category_rel(&tree.children[1]);
}

// Empty-dir filtering (parity with JS _readCategory)
// ----------------------------------------------------------------------------

#[rstest]
fn empty_subdir_without_index_dropped(fixture: Fixture) {
	fixture.dir("cat/empty");
	fixture.file("cat/keep.md", "");

	let tree = scan(&fixture, "cat", None);
	let dirs: Vec<_> = tree
		.children
		.iter()
		.filter_map(|n| match n {
			NodeDto::Category { directory, .. } => Some(directory.to_str().unwrap().to_string()),
			_ => None,
		})
		.collect();
	assert!(dirs.is_empty(), "empty dir without index should be dropped, got {:?}", dirs);
}

#[rstest]
fn nested_empty_chain_dropped(fixture: Fixture) {
	fixture.dir("cat/a/b/c/d");

	let tree = scan(&fixture, "cat", None);
	assert!(
		tree.children.is_empty(),
		"chain of empty dirs without index should collapse to nothing, got {:?}",
		tree.children
	);
}

#[rstest]
fn empty_chain_with_only_deep_docroot_dropped(fixture: Fixture) {
	// `cat/a/b/c/d/docroot.yaml` exists but no markdown anywhere.
	// JS skips intermediate dirs because no `.md` descendants within depth 3.
	fixture.file("cat/a/b/c/d/docroot.yaml", "");

	let tree = scan(&fixture, "cat", None);
	let dirs: Vec<_> = tree
		.children
		.iter()
		.filter_map(|n| match n {
			NodeDto::Category { directory, .. } => Some(directory.to_str().unwrap().to_string()),
			_ => None,
		})
		.collect();
	assert!(
		dirs.is_empty(),
		"deep docroot-only chain should produce no Category nodes, got {:?}",
		dirs
	);
}

#[rstest]
fn empty_subdir_with_index_kept(fixture: Fixture) {
	// Subdir has only an index file (no articles, no children) — should still be kept.
	fixture.file("cat/sub/category.yaml", "---\ntitle: S\n---\n");

	let tree = scan(&fixture, "cat", None);
	assert_eq!(tree.children.len(), 1);
	match &tree.children[0] {
		NodeDto::Category {
			directory,
			has_index,
			children,
			..
		} => {
			assert_eq!(directory.to_str(), Some("sub"));
			assert!(*has_index);
			assert!(children.is_empty());
		}
		_ => panic!("expected Category"),
	}
}

#[rstest]
fn sibling_empty_dropped_sibling_with_articles_kept(fixture: Fixture) {
	fixture.dir("cat/empty");
	fixture.file("cat/with-content/article.md", "");

	let tree = scan(&fixture, "cat", None);
	let dirs: Vec<_> = tree
		.children
		.iter()
		.filter_map(|n| match n {
			NodeDto::Category { directory, .. } => Some(directory.to_str().unwrap().to_string()),
			_ => None,
		})
		.collect();
	assert_eq!(dirs, vec!["with-content".to_string()]);
}