use std::path::Path;
use std::path::PathBuf;

use gramaxfs::backend::close_delimiter;
use gramaxfs::backend::open_delimiter_len;
use gramaxfs::backend::Fs;
use gramaxfs::DirStat;
use serde::Serialize;

use crate::error::Result;
use crate::scan::utils::empty_object;
use crate::scan::utils::find_docroot;
use crate::scan::utils::read_docroot_props;
use crate::scan::utils::yaml_to_json_or_empty;
use crate::scan::workspace::ScanOpts;

#[derive(Serialize, Debug, Clone)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum NodeDto {
	#[serde(rename_all = "camelCase")]
	Article {
		rel_path: PathBuf,
		front_matter: serde_json::Value,
		parse_error: Option<String>,
	},
	#[serde(rename_all = "camelCase")]
	Category {
		rel_path: PathBuf,
		directory: PathBuf,
		has_index: bool,
		front_matter: serde_json::Value,
		children: Vec<NodeDto>,
	},
}

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CatalogTreeDto {
	pub docroot_rel: Option<PathBuf>,
	pub catalog_props: serde_json::Value,
	pub children: Vec<NodeDto>,
}

pub struct CatalogScanner<'p> {
	fp: &'p dyn Fs,
	path: &'p Path,
	docroot_rel: Option<PathBuf>,
	opts: &'p ScanOpts,
}

impl<'p> CatalogScanner<'p> {
	pub fn new(fp: &'p dyn Fs, path: &'p Path, docroot_rel: Option<&'p Path>, opts: &'p ScanOpts) -> Self {
		let docroot_rel = match docroot_rel {
			Some(p) => Some(p.to_path_buf()),
			None => find_docroot(fp, path, opts).and_then(|p| p.strip_prefix(path).ok().map(|p| p.to_path_buf())),
		};
		Self { fp, path, docroot_rel, opts }
	}

	pub fn scan(&self) -> Result<CatalogTreeDto> {
		let _otel = gramaxfs::suppress_orphan_telemetry();
		let catalog_props = match self.docroot_rel.as_ref() {
			Some(rel) => read_docroot_props(self.fp, Some(&self.path.join(rel))),
			None => empty_object(),
		};
		let children = self.walk_root();

		Ok(CatalogTreeDto {
			docroot_rel: self.docroot_rel.clone(),
			catalog_props,
			children,
		})
	}

	fn walk_root(&self) -> Vec<NodeDto> {
		let root_dir = self.root_dir();
		let (_index_entry, articles, subdirs) = self.split_dir_entries(&root_dir);
		self.collect_children(&root_dir, &articles, &subdirs)
	}

	fn root_dir(&self) -> PathBuf {
		match self.docroot_rel.as_ref() {
			Some(rel) => self
				.path
				.join(rel)
				.parent()
				.map(Path::to_path_buf)
				.unwrap_or_else(|| self.path.to_path_buf()),
			None => self.path.to_path_buf(),
		}
	}

	fn walk_dir(&self, dir: &Path) -> Option<NodeDto> {
		let (index_entry, articles, subdirs) = self.split_dir_entries(dir);
		let children = self.collect_children(dir, &articles, &subdirs);

		let has_index = index_entry.is_some();
		if !has_index && children.is_empty() {
			return None;
		}

		let front_matter = match index_entry.as_ref() {
			Some(e) => self.read_index_frontmatter(&dir.join(&e.name)),
			None => empty_object(),
		};

		let directory = rel(self.path, dir);
		let rel_path = match index_entry.as_ref() {
			Some(e) => rel(self.path, &dir.join(&e.name)),
			None => directory.clone(),
		};

		Some(NodeDto::Category {
			rel_path,
			directory,
			has_index,
			front_matter,
			children,
		})
	}

	fn split_dir_entries(&self, dir: &Path) -> (Option<DirStat>, Vec<DirStat>, Vec<DirStat>) {
		let entries = self.fp.read_dir_stats(dir).unwrap_or_default();

		let mut articles: Vec<DirStat> = Vec::new();
		let mut subdirs: Vec<DirStat> = Vec::new();
		let mut index_entry: Option<DirStat> = None;
		let mut index_priority: usize = usize::MAX;

		for entry in entries {
			if self.opts.is_excluded(&entry.name) {
				continue;
			}
			if self.opts.docroot_filenames.iter().any(|n| n == &entry.name) {
				continue;
			}
			if entry.stat.is_file() {
				if let Some(p) = self.opts.category_index_filename.iter().position(|n| n == &entry.name) {
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

		(index_entry, articles, subdirs)
	}

	#[cfg(not(target_family = "wasm"))]
	fn collect_children(&self, dir: &Path, articles: &[DirStat], subdirs: &[DirStat]) -> Vec<NodeDto> {
		use rayon::prelude::*;

		let articles_task = || -> Vec<NodeDto> {
			articles
				.par_iter()
				.filter_map(|e| {
					let _otel = gramaxfs::suppress_orphan_telemetry();
					self.read_article(&dir.join(&e.name))
				})
				.collect()
		};

		let subdirs_task = || -> Vec<NodeDto> {
			subdirs
				.par_iter()
				.filter_map(|e| {
					let _otel = gramaxfs::suppress_orphan_telemetry();
					self.walk_dir(&dir.join(&e.name))
				})
				.collect()
		};

		let (article_results, subdir_results) = rayon::join(articles_task, subdirs_task);

		let mut children: Vec<NodeDto> = Vec::with_capacity(article_results.len() + subdir_results.len());
		children.extend(article_results);
		children.extend(subdir_results);
		children
	}

	#[cfg(target_family = "wasm")]
	fn collect_children(&self, dir: &Path, articles: &[DirStat], subdirs: &[DirStat]) -> Vec<NodeDto> {
		let mut children: Vec<NodeDto> = Vec::with_capacity(articles.len() + subdirs.len());
		children.extend(articles.iter().filter_map(|e| self.read_article(&dir.join(&e.name))));
		children.extend(subdirs.iter().filter_map(|e| self.walk_dir(&dir.join(&e.name))));
		children
	}

	fn read_index_frontmatter(&self, path: &Path) -> serde_json::Value {
		let bytes = match self.fp.read_frontmatter(path) {
			Ok(b) => b,
			Err(_) => return empty_object(),
		};
		parse_frontmatter(&bytes).0
	}

	fn read_article(&self, path: &Path) -> Option<NodeDto> {
		let bytes = self.fp.read_frontmatter(path).ok()?;
		let (front_matter, parse_error) = parse_frontmatter(&bytes);

		Some(NodeDto::Article {
			rel_path: rel(self.path, path),
			front_matter,
			parse_error,
		})
	}
}

fn rel(base: &Path, path: &Path) -> PathBuf {
	path.strip_prefix(base).map(|p| p.to_path_buf()).unwrap_or_else(|_| path.to_path_buf())
}

fn is_markdown(name: &str) -> bool {
	name.ends_with(".md") || name.ends_with(".markdown")
}

/// Parses bytes of a frontmatter region as returned by `Fs::read_frontmatter`.
/// Returns `({}, None)` for empty/missing frontmatter and `({}, Some(err))` for malformed YAML
/// or unterminated fences. Tolerates trailing whitespace on `---` delimiter lines (gray-matter parity).
fn parse_frontmatter(bytes: &[u8]) -> (serde_json::Value, Option<String>) {
	let Some(open) = open_delimiter_len(bytes) else {
		return (empty_object(), None);
	};
	let Some((yaml_end, _)) = close_delimiter(&bytes[open..]) else {
		return (empty_object(), Some("unterminated frontmatter".into()));
	};
	match yaml_to_json_or_empty(&bytes[open..open + yaml_end]) {
		Ok(v) => (v, None),
		Err(e) => (empty_object(), Some(e.to_string())),
	}
}
