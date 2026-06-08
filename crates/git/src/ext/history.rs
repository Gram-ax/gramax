use std::collections::HashMap;
use std::collections::HashSet;
use std::ops::Deref;
use std::path::Path;

use git2::*;

use chrono::{DateTime, Utc};

use serde::Deserialize;
use serde::Serialize;

use crate::actions::diff::DiffFile;
use crate::creds::Creds;
use crate::error::OrUtf8Err;
use crate::prelude::Branch;
use crate::repo::Repo;
use crate::OidInfo;
use crate::Result;
use crate::ShortInfo;
use crate::SignatureInfo;
use crate::utils::md_frontmatter::MdFrontmatterParser;

const TAG: &str = "git:history";

#[derive(Serialize, Debug)]
#[serde(transparent)]
pub struct HistoryInfo(Vec<DiffFile>);

impl Deref for HistoryInfo {
	type Target = Vec<DiffFile>;

	fn deref(&self) -> &Self::Target {
		&self.0
	}
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitAuthorInfo {
	#[serde(flatten)]
	pub author: SignatureInfo,
	pub count: usize,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BranchCommitsInfo {
	pub authors: Vec<CommitAuthorInfo>,
	pub commits: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitFilterOptions {
	pub authors: Option<Vec<String>>,
	pub before_date: Option<String>,
	pub after_date: Option<String>,
	pub paths: Option<Vec<String>>,
}


#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitInfoOpts {
	pub depth: usize,
	#[serde(default)]
	pub simplify: bool,
	pub filters: Option<CommitFilterOptions>,
	pub include_changed_files: Option<bool>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChangedFileInfo {
	pub path: String,
	pub title: Option<String>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct StatInfo {
	pub added: usize,
	pub deleted: usize,
	pub changed_files: Option<Vec<ChangedFileInfo>>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitInfo {
	pub author: SignatureInfo,
	pub timestamp: i64,
	pub oid: OidInfo,
	pub summary: String,
	pub parents: Vec<OidInfo>,
	pub stat: StatInfo,
}

pub trait History {
	fn history<P: AsRef<Path>>(&self, path: P, offset: usize, limit: usize) -> Result<HistoryInfo>;

	fn get_all_authors(&self) -> Result<Vec<CommitAuthorInfo>>;

	fn get_branch_commits<S: AsRef<str>>(&self, ours: S, theirs: S, max: Option<usize>) -> Result<BranchCommitsInfo>;

	fn get_commit_info(&self, oid: Oid, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>>;
}

impl<C: Creds> History for Repo<'_, C> {
	fn get_commit_info(&self, oid: Oid, opts: CommitInfoOpts) -> Result<Vec<CommitInfo>> {
		let mut res = Vec::with_capacity(opts.depth);

		let filter_authors: Option<HashSet<&str>> = opts
			.filters
			.as_ref()
			.and_then(|f| f.authors.as_deref())
			.filter(|v| !v.is_empty())
			.map(|v| v.iter().map(|s| s.as_str()).collect());

		let filter_before = opts
			.filters
			.as_ref()
			.and_then(|f| f.before_date.as_deref())
			.and_then(|s| DateTime::parse_from_rfc3339(s).ok())
			.map(|dt| dt.with_timezone(&Utc).timestamp());

		let filter_after = opts
			.filters
			.as_ref()
			.and_then(|f| f.after_date.as_deref())
			.and_then(|s| DateTime::parse_from_rfc3339(s).ok())
			.map(|dt| dt.with_timezone(&Utc).timestamp());

		let include_changed_files = opts.include_changed_files.unwrap_or(false);
		let filter_paths = opts.filters.as_ref().and_then(|f| f.paths.as_deref()).filter(|p| !p.is_empty());

		let mut diff_opts = filter_paths.map(|paths| {
			let mut opts = DiffOptions::new();
			for path in paths {
				opts.pathspec(path);
			}
			opts.skip_binary_check(true);
			opts.include_typechange(false);
			opts.ignore_blank_lines(true);
			opts.patience(false);
			return opts;
		});

		let mut revwalk = self.0.revwalk()?;
		revwalk.set_sorting(Sort::TOPOLOGICAL | Sort::TIME)?;
		revwalk.push(oid)?;

		if opts.simplify {
			revwalk.simplify_first_parent()?;
		}

		for oid in revwalk {
			if res.len() >= opts.depth {
				break;
			}

			let oid = oid?;
			let commit = self.0.find_commit(oid)?;
			let author = commit.author();
			let commit_time = commit.time().seconds();

			if let Some(after) = filter_after {
				if commit_time <= after {
					break;
				}
			}

			if let Some(before) = filter_before {
				if commit_time >= before {
					continue;
				}
			}

			if let Some(filter) = &filter_authors {
				if !filter.contains(author.email().unwrap_or("")) {
					continue;
				}
			}

			let commit_tree = commit.tree()?;
			let parent_tree = commit.parents().next().and_then(|p| p.tree().ok());
			let diff = self.0.diff_tree_to_tree(parent_tree.as_ref(), Some(&commit_tree), diff_opts.as_mut())?;

			if diff_opts.is_some() && diff.deltas().next().is_none() {
				continue;
			}

			let diff_stats = diff.stats()?;

			let mut changed_files: Option<Vec<ChangedFileInfo>> = None;
			if include_changed_files {
				let file_changes = std::cell::RefCell::new(Vec::<(String, u32, bool)>::new());

				diff.foreach(
					&mut |delta, _| {
						let deleted = delta.status() == Delta::Deleted;
						let path = delta
							.new_file()
							.path()
							.or_else(|| delta.old_file().path())
							.and_then(|p| p.to_str())
							.unwrap_or("")
							.to_string();
						file_changes.borrow_mut().push((path, 0, deleted));
						true
					},
					None,
					Some(&mut |_c_delta, hunk| {
						if let Some(last) = file_changes.borrow_mut().last_mut() {
							last.1 += hunk.old_lines() + hunk.new_lines();
						}
						true
					}),
					None,
				)?;
				
				let mut file_changes = file_changes.into_inner();

				file_changes.sort_by(|a, b| b.1.cmp(&a.1));
				changed_files = Some(
					file_changes
						.into_iter()
						.map(|(path, _, deleted)| {
						let title = if path.ends_with(".md") {
							let tree = if deleted {
								parent_tree.as_ref()
							} else {
								Some(&commit_tree)
							};

							tree
								.and_then(|t| t.get_path(std::path::Path::new(&path)).ok())
								.and_then(|entry| entry.to_object(&self.0).ok())
								.and_then(|obj| obj.into_blob().ok())
								.and_then(|blob| {
									let content = std::str::from_utf8(blob.content()).ok()?;
									MdFrontmatterParser.parse_frontmatter(content).ok()?.title
								})
						} else {
							None
						};
							ChangedFileInfo { path, title }
						})
						.collect(),
				);
			}

			let stat = StatInfo { added: diff_stats.insertions(), deleted: diff_stats.deletions(), changed_files };

			let timestamp = commit_time * 1000;
			let summary = commit.summary().or_utf8_err()?.to_string();
			let parents = commit.parents().filter_map(|p| p.id().short_info().ok()).collect();

			res.push(CommitInfo {
				author: author.short_info()?,
				timestamp,
				oid: oid.short_info()?,
				summary,
				parents,
				stat,
			});
		}

		Ok(res)
	}

	fn get_all_authors(&self) -> Result<Vec<CommitAuthorInfo>> {
		let mut authors = HashMap::new();
		let mut revwalk = self.0.revwalk()?;
		revwalk.push_glob("refs/heads/*")?;

		for oid in revwalk {
			let commit = self.0.find_commit(oid?)?;
			let author = commit.author();

			let author_email = author.email().unwrap_or("<invalid-utf8>");

			match authors.get_mut(author_email) {
				Some(count) => *count += 1,
				None => {
					authors.insert(author.short_info()?, 1);
				}
			}
		}

		Ok(authors.into_iter().map(|(author, count)| CommitAuthorInfo { author, count }).collect())
	}

	fn get_branch_commits<S: AsRef<str>>(&self, ours: S, theirs: S, limit: Option<usize>) -> Result<BranchCommitsInfo> {
		let mut authors = HashMap::new();
		let mut commits = vec![];

		let theirs = self.branch_by_name(theirs.as_ref(), None)?;

		let ours = self.branch_by_name(ours.as_ref(), None)?;

		let mut revwalk = self.0.revwalk()?;
		revwalk.push_range(&format!("{}..{}", ours.last_commit.id(), theirs.last_commit.id()))?;

		for oid in revwalk.take(limit.unwrap_or(usize::MAX)) {
			let commit = self.0.find_commit(oid?)?;
			let author = commit.author().short_info()?;

			match commit.summary() {
				Some(summary) => commits.push(summary.to_string()),
				None => commits.push(format!("{} <invalid summary utf-8>", commit.id())),
			}

			match authors.get_mut(&author) {
				Some(count) => *count += 1,
				None => {
					authors.insert(author, 1);
				}
			}
		}

		let authors = authors.into_iter().map(|(author, count)| CommitAuthorInfo { author, count }).collect();

		Ok(BranchCommitsInfo { authors, commits })
	}

	fn history<P: AsRef<Path>>(&self, path: P, offset: usize, limit: usize) -> Result<HistoryInfo> {
		let mut found = 0;
		let mut history = vec![];

		let mut revwalk = self.0.revwalk()?;
		revwalk.push_head()?;

		let mut revwalk = revwalk.filter_map(|oid| oid.and_then(|oid| self.0.find_commit(oid)).ok());

		let Some(mut older_commit) = revwalk.next() else {
			return Ok(HistoryInfo(vec![]));
		};

		let mut inspected = 0;
		let mut path = path.as_ref().to_path_buf();
		let total_needed = offset + limit;

		for c in revwalk {
			if found >= total_needed {
				break;
			}

			// skip merge commits
			if c.parent_count() > 1 {
				continue;
			}

			inspected += 1;

			let newer_commit = std::mem::replace(&mut older_commit, c);
			let newer_commit_tree = newer_commit.tree()?;
			let older_commit_tree = older_commit.tree()?;

			if newer_commit_tree.get_path(path.as_path()).is_err() {
				continue;
			}

			let mut diff_opts = DiffOptions::new();
			diff_opts
				.enable_fast_untracked_dirs(true)
				.pathspec(path.as_path())
				.disable_pathspec_match(true)
				.ignore_submodules(true);

			match self
				.0
				.diff_tree_to_tree(Some(&older_commit_tree), Some(&newer_commit_tree), Some(&mut diff_opts))?
				.deltas()
				.next()
			{
				Some(delta) if delta.status() == Delta::Modified => {
					found += 1;
					if found > offset {
						history.push(DiffFile::from_diff_delta(&self.0, &newer_commit, &delta)?);
					}
					continue;
				}
				Some(_) => {}
				None => {
					continue;
				}
			};

			let mut diff = self.0.diff_tree_to_tree(Some(&older_commit_tree), Some(&newer_commit_tree), None)?;
			let mut find_opts = DiffFindOptions::new();
			find_opts.renames(true).exact_match_only(true);
			diff.find_similar(Some(&mut find_opts))?;

			if let Some(delta) = diff
				.deltas()
				.find(|delta| delta.new_file().path().is_some_and(|p| p.eq(&path)) && matches!(delta.status(), Delta::Modified | Delta::Renamed))
			{
				if let Some(p) = delta.old_file().path() {
					path = p.to_path_buf();
				}
				found += 1;
				if found > offset {
					let diff = DiffFile::from_diff_delta(&self.0, &newer_commit, &delta)?;
					history.push(diff);
				}
				continue;
			}

			let mut diff = self.0.diff_tree_to_tree(Some(&older_commit_tree), Some(&newer_commit_tree), None)?;
			let mut find_opts = DiffFindOptions::new();
			find_opts.renames(true).exact_match_only(false);
			diff.find_similar(Some(&mut find_opts))?;

			if let Some(delta) = diff.deltas().find(|delta| delta.new_file().path().is_some_and(|p| p.eq(&path))) {
				if let Some(p) = delta.old_file().path() {
					path = p.to_path_buf();
				}
				found += 1;
				if found > offset {
					let diff = DiffFile::from_diff_delta(&self.0, &newer_commit, &delta)?;
					history.push(diff);
				}
				continue;
			}
		}

		// collect the init commit if we've crawled to the end
		if found < total_needed {
			let diff = self.0.diff_tree_to_tree(None, Some(&older_commit.tree()?), None)?;

			if let Some(delta) = diff.deltas().find(|delta| delta.new_file().path().is_some_and(|p| p.eq(&path))) {
				found += 1;
				if found > offset {
					let diff = DiffFile::from_diff_delta(&self.0, &older_commit, &delta)?;
					history.push(diff);
				}
			}
		}

		info!(
			target: TAG,
			"looked up for history of file {}; inspected {} commits & collected {}/{} history entries (offset: {})",
			path.display(),
			inspected,
			history.len(),
			limit,
			offset
		);

		Ok(HistoryInfo(history))
	}
}
