use std::path::Path;
use std::path::PathBuf;

use gramaxfs::backend::Fs;
use gramaxfs::DirStat;
use serde::Serialize;

use tracing::warn;

use crate::error::Result;
use crate::scan::utils::empty_object;
use crate::scan::utils::yaml_to_json_or_empty;
use crate::scan::workspace::ScanOpts;

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum NodeDto {
	#[serde(rename_all = "camelCase")]
	Article {
		rel_path: PathBuf,
		name: String,
		m_time_ms: u128,
		size: u64,
		front_matter: serde_json::Value,
		content: String,
		parse_error: Option<String>,
	},
	#[serde(rename_all = "camelCase")]
	Category {
		rel_path: PathBuf,
		directory: PathBuf,
		name: String,
		has_index: bool,
		front_matter: serde_json::Value,
		content: String,
		m_time_ms: u128,
		children: Vec<NodeDto>,
	},
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CatalogTreeDto {
	pub name: String,
	pub base_path: PathBuf,
	pub docroot_rel: Option<PathBuf>,
	pub catalog_props: serde_json::Value,
	pub root: NodeDto,
}

pub fn scan_catalog(fp: &dyn Fs, path: &Path, docroot_abs: Option<&Path>, opts: &ScanOpts) -> Result<CatalogTreeDto> {
	let docroot_rel = docroot_abs.and_then(|p| p.strip_prefix(path).ok()).map(|p| p.to_path_buf());

	let catalog_props = match docroot_abs {
		Some(p) => match fp.read(p) {
			Ok(bytes) => yaml_to_json_or_empty(&bytes).unwrap_or_else(|e| {
				warn!(path = %p.display(), error = %e, "docroot yaml parse failed");
				empty_object()
			}),
			Err(e) => {
				warn!(path = %p.display(), error = ?e, "docroot read failed");
				empty_object()
			}
		},
		None => empty_object(),
	};

	let name = path.file_name().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
	let root = walk_dir(fp, path, path, opts);

	Ok(CatalogTreeDto {
		name,
		base_path: path.to_path_buf(),
		docroot_rel,
		catalog_props,
		root,
	})
}

fn walk_dir(fp: &dyn Fs, base: &Path, dir: &Path, opts: &ScanOpts) -> NodeDto {
	let entries = fp.read_dir_stats(dir).unwrap_or_default();

	let mut articles: Vec<DirStat> = Vec::new();
	let mut subdirs: Vec<DirStat> = Vec::new();
	let mut index_entry: Option<DirStat> = None;
	let mut index_priority: usize = usize::MAX;

	for entry in entries {
		if opts.is_excluded(&entry.name) {
			continue;
		}
		if opts.docroot_filenames.iter().any(|n| n == &entry.name) {
			continue;
		}
		if entry.stat.is_file() {
			if let Some(p) = opts.category_index_filename.iter().position(|n| n == &entry.name) {
				if p < index_priority {
					index_priority = p;
					index_entry = Some(entry);
				}
				continue;
			}
			if is_markdown(&entry.name) {
				articles.push(entry);
			}
			continue;
		}
		if entry.stat.is_dir() {
			subdirs.push(entry);
		}
	}

	articles.sort_by(|a, b| a.name.cmp(&b.name));
	subdirs.sort_by(|a, b| a.name.cmp(&b.name));

	let children = collect_children(fp, base, dir, &articles, &subdirs, opts);

	let has_index = index_entry.is_some();
	let (front_matter, content, m_time_ms) = match index_entry.as_ref() {
		Some(e) => read_index(fp, &dir.join(&e.name)),
		None => (empty_object(), String::new(), 0),
	};

	let directory = rel(base, dir);
	let rel_path = match index_entry.as_ref() {
		Some(e) => rel(base, &dir.join(&e.name)),
		None => directory.clone(),
	};
	let name = dir.file_name().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();

	NodeDto::Category {
		rel_path,
		directory,
		name,
		has_index,
		front_matter,
		content,
		m_time_ms,
		children,
	}
}

#[cfg(not(target_family = "wasm"))]
fn collect_children(fp: &dyn Fs, base: &Path, dir: &Path, articles: &[DirStat], subdirs: &[DirStat], opts: &ScanOpts) -> Vec<NodeDto> {
	use rayon::prelude::*;

	let articles_task = || -> Vec<NodeDto> {
		articles
			.par_iter()
			.filter_map(|e| {
				let p = dir.join(&e.name);
				read_article(fp, base, &p, e)
			})
			.collect()
	};

	let subdirs_task = || -> Vec<NodeDto> { subdirs.par_iter().map(|e| walk_dir(fp, base, &dir.join(&e.name), opts)).collect() };

	let (article_results, subdir_results) = rayon::join(articles_task, subdirs_task);

	let mut children: Vec<NodeDto> = Vec::with_capacity(article_results.len() + subdir_results.len());
	children.extend(article_results);
	children.extend(subdir_results);
	children
}

#[cfg(target_family = "wasm")]
fn collect_children(fp: &dyn Fs, base: &Path, dir: &Path, articles: &[DirStat], subdirs: &[DirStat], opts: &ScanOpts) -> Vec<NodeDto> {
	let mut children: Vec<NodeDto> = Vec::with_capacity(articles.len() + subdirs.len());
	children.extend(articles.iter().filter_map(|e| {
		let p = dir.join(&e.name);
		read_article(fp, base, &p, e)
	}));
	children.extend(subdirs.iter().map(|e| walk_dir(fp, base, &dir.join(&e.name), opts)));
	children
}

fn read_index(fp: &dyn Fs, path: &Path) -> (serde_json::Value, String, u128) {
	let bytes = match fp.read(path) {
		Ok(b) => b,
		Err(_) => return (empty_object(), String::new(), 0),
	};
	let m_time_ms = fp.stat(path, false).ok().map(|s| s.modified_ms()).unwrap_or(0);
	let (fm, content, _err) = split_frontmatter(&bytes);
	(fm, content, m_time_ms)
}

fn read_article(fp: &dyn Fs, base: &Path, path: &Path, entry: &DirStat) -> Option<NodeDto> {
	let bytes = fp.read_frontmatter(path).ok()?;
	let (front_matter, _, parse_error) = split_frontmatter(&bytes);

	Some(NodeDto::Article {
		rel_path: rel(base, path),
		name: entry.name.clone(),
		m_time_ms: entry.stat.modified_ms(),
		size: entry.stat.size(),
		front_matter,
		content: String::new(),
		parse_error,
	})
}

fn rel(base: &Path, path: &Path) -> PathBuf {
	path.strip_prefix(base).map(|p| p.to_path_buf()).unwrap_or_else(|_| path.to_path_buf())
}

fn is_markdown(name: &str) -> bool {
	name.ends_with(".md") || name.ends_with(".markdown")
}

/// Splits `---\n<yaml>\n---\n<body>`. Returns ({}, content, None) if no frontmatter.
fn split_frontmatter(bytes: &[u8]) -> (serde_json::Value, String, Option<String>) {
	let text = match std::str::from_utf8(bytes) {
		Ok(s) => s,
		Err(_) => return (empty_object(), String::new(), Some("invalid utf-8".into())),
	};

	let stripped = text.strip_prefix("---\n").or_else(|| text.strip_prefix("---\r\n"));
	let Some(rest) = stripped else {
		return (empty_object(), text.trim().to_string(), None);
	};

	let end = rest.find("\n---\n").or_else(|| rest.find("\n---\r\n"));
	let Some(end) = end else {
		return (empty_object(), text.trim().to_string(), Some("unterminated frontmatter".into()));
	};

	let yaml_part = &rest[..end];
	let body_start = rest[end..].find('\n').map(|i| end + i + 1).unwrap_or(rest.len());
	let body = &rest[body_start..];

	let fm = match yaml_to_json_or_empty(yaml_part.as_bytes()) {
		Ok(v) => v,
		Err(e) => return (empty_object(), body.trim().to_string(), Some(e.to_string())),
	};

	(fm, body.trim().to_string(), None)
}
