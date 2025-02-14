use std::cell::RefCell;
use std::path::PathBuf;

use git2::*;

use serde::Deserialize;
use serde::Serialize;

use crate::creds::Creds;
use crate::error::Error;
use crate::prelude::Repo;
use crate::OidInfo;
use crate::Result;

use crate::actions::status::StatusEntry;

const TAG: &str = "git:diff";

pub trait Diff {
  fn conflicts(&self) -> Result<Vec<IndexConflict>>;
  fn diff(&self, opts: DiffConfig) -> Result<DiffTree2TreeInfo>;
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type")]
pub enum DiffCompareOptions {
  #[serde(rename = "tree")]
  Tree2Tree { new: OidInfo, old: OidInfo },
  #[serde(rename = "workdir")]
  Tree2Workdir { tree: Option<OidInfo> },
  #[serde(rename = "index")]
  Tree2Index { tree: Option<OidInfo> },
}

impl Default for DiffCompareOptions {
  fn default() -> Self {
    Self::Tree2Workdir { tree: None }
  }
}

#[derive(Deserialize, Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiffConfig {
  #[serde(default)]
  pub compare: DiffCompareOptions,
  pub renames: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Hunk {
  pub content: String,
  pub status: StatusEntry,
}

#[derive(Serialize, Default, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpstreamCountChangedFiles {
  pub pull: usize,
  pub push: usize,
  pub has_changes: bool,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiffTree2TreeInfo {
  pub has_changes: bool,
  pub added: usize,
  pub deleted: usize,
  pub files: Vec<DiffTree2TreeFile>,
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiffTree2TreeFile {
  pub path: PathBuf,
  pub old_path: Option<PathBuf>,
  pub status: StatusEntry,
  pub added: usize,
  pub deleted: usize,
}

impl<C: Creds> Diff for Repo<C> {
  fn conflicts(&self) -> Result<Vec<IndexConflict>> {
    let index = self.0.index()?;
    let mut conflicts = vec![];
    for conflict in index.conflicts()? {
      conflicts.push(conflict?);
    }
    Ok(conflicts)
  }

  fn diff(&self, opts: DiffConfig) -> Result<DiffTree2TreeInfo> {
    let mut diff_opts = git2::DiffOptions::new();
    diff_opts.context_lines(0);

    let mut diff = match opts.compare {
      DiffCompareOptions::Tree2Tree { new, old } => {
        let old_tree = self.0.find_object(old.parse()?, None).and_then(|o| o.peel_to_tree()).ok();
        let new_tree = self.0.find_object(new.parse()?, None).and_then(|o| o.peel_to_tree()).ok();

        info!(target: TAG, "tree2tree diff: {} -> {}", old.0, new.0);
        self.0.diff_tree_to_tree(old_tree.as_ref(), new_tree.as_ref(), Some(&mut diff_opts))?
      }
      DiffCompareOptions::Tree2Workdir { tree: tree_id } => {
        let tree = match tree_id {
          Some(ref tree) => Some(self.0.find_tree(tree.parse()?)?),
          _ => Some(self.0.head()?.peel_to_tree()?),
        };

        info!(target: TAG, "tree2workdir diff: {} -> workdir", tree_id.map(|t| t.0).unwrap_or_else(|| "head".to_string()));
        self.0.diff_tree_to_workdir_with_index(tree.as_ref(), Some(&mut diff_opts))?
      }

      DiffCompareOptions::Tree2Index { tree: tree_id } => {
        let tree = match tree_id {
          Some(ref tree) => Some(self.0.find_tree(tree.parse()?)?),
          _ => Some(self.0.head()?.peel_to_tree()?),
        };

        info!(target: TAG, "tree2index diff: {} -> index", tree_id.map(|t| t.0).unwrap_or_else(|| "head".to_string()));

        let index = self.0.index()?;
        self.0.diff_tree_to_index(tree.as_ref(), Some(&index), Some(&mut diff_opts))?
      }
    };

    if opts.renames {
      let mut find_opts = DiffFindOptions::new();
      find_opts.renames(true);
      diff.find_similar(Some(&mut find_opts))?;
    }

    self.collect_diff_deltas(diff)
  }
}

impl<C: Creds> Repo<C> {
  fn collect_diff_deltas(&self, diff: git2::Diff<'_>) -> Result<DiffTree2TreeInfo> {
    let total_deletions = diff.stats()?.deletions();
    let total_additions = diff.stats()?.insertions();

    let files = RefCell::new(Vec::<DiffTree2TreeFile>::new());

    let mut file_callback = |diff: DiffDelta<'_>, _: f32| -> bool {
      let mut files = files.borrow_mut();
      let Some(path) = diff.new_file().path().map(PathBuf::from) else {
        warn!(target: TAG, "expected file path to be present in diff delta but got None; stopping iteration");
        return false;
      };

      let old_path = diff.old_file().path().map(PathBuf::from);

      let file = DiffTree2TreeFile { path, old_path, status: diff.status().into(), added: 0, deleted: 0 };
      files.push(file);

      true
    };

    let mut line_callback = |_: DiffDelta<'_>, _: Option<DiffHunk<'_>>, line: DiffLine<'_>| -> bool {
      let mut files = files.borrow_mut();
      let Some(file) = files.last_mut() else {
        error!(target: TAG, "expected file to be already set but None received; stopping iteration");
        return false;
      };

      match line.origin_value() {
        DiffLineType::Addition => file.added += 1,
        DiffLineType::Deletion => file.deleted += 1,
        _ => {}
      };

      true
    };

    diff.foreach(&mut file_callback, None, None, Some(&mut line_callback))?;

    Ok(DiffTree2TreeInfo {
      has_changes: total_deletions + total_additions > 0,
      added: total_additions,
      deleted: total_deletions,
      files: files.take(),
    })
  }
}

#[derive(Serialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DiffFile {
  author_name: String,
  author_email: String,
  commit_oid: String,
  date: i64,
  path: PathBuf,
  content: Option<String>,
  parent_path: Option<PathBuf>,
  parent_content: Option<String>,
  pub has_changes: bool,
}

impl DiffFile {
  pub fn from_blobs(
    repo: &Repository,
    commit: &Commit,
    lhs: Option<&Blob>,
    lhs_path: PathBuf,
    rhs: Option<&Blob>,
    rhs_path: PathBuf,
    opts: Option<&mut git2::DiffOptions>,
  ) -> Result<Self> {
    let signature = commit.author();
    let mut has_changes = false;
    repo.diff_blobs(
      rhs,
      None,
      lhs,
      None,
      opts,
      Some(&mut |_, _| {
        has_changes = true;
        true
      }),
      None,
      None,
      None,
    )?;

    let rhs = rhs.map(|blob| String::from_utf8_lossy(blob.content()).to_string());
    let lhs = lhs.map(|blob| String::from_utf8_lossy(blob.content()).to_string());
    let diff = DiffFile {
      author_name: signature.name().ok_or(Error::Utf8)?.into(),
      author_email: signature.email().ok_or(Error::Utf8)?.into(),
      commit_oid: commit.id().to_string(),
      date: commit.time().seconds() * 1000,
      path: rhs_path,
      content: rhs,
      parent_path: lhs.as_ref().map(|_| lhs_path),
      parent_content: lhs,
      has_changes,
    };

    Ok(diff)
  }

  pub fn from_diff_delta(repo: &Repository, commit: &Commit, delta: &DiffDelta) -> Result<Self> {
    let signature = commit.author();

    Ok(Self {
      author_name: signature.name().ok_or(Error::Utf8)?.into(),
      author_email: signature.email().ok_or(Error::Utf8)?.into(),
      commit_oid: commit.id().to_string(),
      date: commit.time().seconds() * 1000,
      path: delta.new_file().path().map(|p| p.to_path_buf()).ok_or(Error::Utf8)?,
      content: repo
        .find_blob(delta.new_file().id())
        .ok()
        .and_then(|b| String::from_utf8(b.content().to_vec()).ok()),
      parent_path: delta.old_file().path().map(|p| p.to_path_buf()),
      parent_content: repo
        .find_blob(delta.old_file().id())
        .ok()
        .and_then(|b| String::from_utf8(b.content().to_vec()).ok()),
      has_changes: true,
    })
  }

  pub fn has_changes(&self) -> bool {
    self.has_changes || !self.parent_path.as_ref().map(|p| p == &self.path).unwrap_or(true)
  }
}

// TODO: Implement correct hunk resolution & context hunks
/*
impl<C: Creds> Repo<C> {
  fn collect_diff_delta(&self, diff: git2::Diff<'_>) -> Result<DiffTree2TreeInfo> {
    let total_deletions = diff.stats()?.deletions();
    let total_additions = diff.stats()?.insertions();

    let files = RefCell::new(Vec::<DiffTree2TreeFile>::new());
    let latest_file_content_new = RefCell::new(None);
    let latest_file_content_old = RefCell::new(None);
    let latest_status = RefCell::new(StatusEntry::Current);

    let context_hunk = RefCell::new(String::new());

    let mut file_callback = |diff: DiffDelta<'_>, _: f32| -> bool {
      let mut files = files.borrow_mut();
      let mut context_hunk = context_hunk.borrow_mut();

      if !context_hunk.is_empty() && files.len() > 0 {
        let hunk = Hunk { content: std::mem::take(&mut context_hunk), status: StatusEntry::Current };
        files.last_mut().unwrap().hunks.push(hunk);
      }

      let Some(path) = diff.new_file().path().map(PathBuf::from) else {
        warn!(target: TAG, "expected file path to be present in diff delta but got None; skipping");
        return false;
      };

      let old_path = diff.old_file().path().map(PathBuf::from);

      let status = diff.status().into();

      match status {
        StatusEntry::Delete => {
          *latest_file_content_new.borrow_mut() = None;
        }
        _ => {
          let Ok(blob) = self.0.find_blob(diff.new_file().id()) else {
            error!(target: TAG, "failed to find blob for new file {} ({}); stopping iteration", path.display(), diff.new_file().id());
            return false;
          };

          let content = blob.content().lines().filter_map(|line| line.ok()).collect::<Vec<_>>();
          *latest_file_content_new.borrow_mut() = Some(content);
        }
      }

      match status {
        StatusEntry::New => {
          *latest_file_content_old.borrow_mut() = None;
        }
        _ => {
          let Ok(blob) = self.0.find_blob(diff.old_file().id()) else {
            error!(target: TAG, "failed to find blob for old file {} ({}); stopping iteration", path.display(), diff.old_file().id());
            return false;
          };

          let content = blob.content().lines().filter_map(|line| line.ok()).collect::<Vec<_>>();
          *latest_file_content_old.borrow_mut() = Some(content);
        }
      }

      let file = DiffTree2TreeFile {
        path,
        old_path,
        status: diff.status().into(),
        hunks: vec![],
        added: 0,
        deleted: 0,
      };
      *context_hunk = String::new();
      *latest_status.borrow_mut() = status;
      files.push(file);

      true
    };

    let mut line_callback = |_: DiffDelta<'_>, _: Option<DiffHunk<'_>>, line: DiffLine<'_>| -> bool {
      let mut files = files.borrow_mut();
      let Some(file) = files.last_mut() else {
        error!(target: TAG, "expected file to be already set but None received; stopping iteration");
        return false;
      };

      let mut status = latest_status.borrow_mut();

      match line.origin_value() {
        DiffLineType::Context => *status = StatusEntry::Current,
        DiffLineType::Addition => {
          *status = StatusEntry::New;
          file.added += 1
        }
        DiffLineType::Deletion => {
          *status = StatusEntry::Delete;
          file.deleted += 1
        }
        DiffLineType::ContextEOFNL => *status = StatusEntry::Current,
        DiffLineType::AddEOFNL => *status = StatusEntry::New,
        DiffLineType::DeleteEOFNL => *status = StatusEntry::Delete,
        DiffLineType::FileHeader => *status = StatusEntry::Current,
        DiffLineType::HunkHeader => *status = StatusEntry::Current,
        DiffLineType::Binary => *status = StatusEntry::Current,
      };

      if *status == StatusEntry::Current {
        context_hunk.borrow_mut().push_str(String::from_utf8_lossy(line.content()).as_ref());
      }

      true
    };

    let mut hunk_callback = |_: DiffDelta<'_>, hunk: DiffHunk<'_>| -> bool {
      let mut files = files.borrow_mut();
      let Some(file) = files.last_mut() else {
        error!(target: TAG, "expected file to be already set but None received; stopping iteration");
        return false;
      };

      let mut context_hunk = context_hunk.borrow_mut();

      if !context_hunk.is_empty() {
        let hunk = Hunk { content: std::mem::take(&mut context_hunk), status: StatusEntry::Current };
        file.hunks.push(hunk);
      }

      let status = *latest_status.borrow();

      let content = latest_file_content_new.borrow();
      let old_content = latest_file_content_old.borrow();

      match status {
        StatusEntry::New => {}
        _ => {
          let Some(content) = old_content.as_deref() else {
            error!(target: TAG, "expected old_content to be already set but None received; stopping iteration");
            return false;
          };

          let range =
            (hunk.old_start() as usize - 1)..(hunk.old_start() as usize + hunk.old_lines() as usize - 1);

          let hunk = Hunk { content: content[range].join("\n"), status: StatusEntry::Delete };
          file.hunks.push(hunk);
        }
      }

      match status {
        StatusEntry::Delete => {}
        _ => {
          let Some(content) = content.as_deref() else {
            error!(target: TAG, "expected content to be already set but None received; stopping iteration");
            return false;
          };

          let range =
            (hunk.new_start() as usize - 1)..(hunk.new_start() as usize + hunk.new_lines() as usize - 1);
          let hunk = Hunk { content: content[range].join("\n"), status: StatusEntry::New };
          file.hunks.push(hunk);
        }
      }

      true
    };

    diff.foreach(&mut file_callback, None, Some(&mut hunk_callback), Some(&mut line_callback))?;

    let mut context_hunk = context_hunk.take();
    let mut files = files.take();
    if !context_hunk.is_empty() && !files.is_empty() {
      let hunk = Hunk { content: std::mem::take(&mut context_hunk), status: StatusEntry::Current };
      files.last_mut().unwrap().hunks.push(hunk);
    }

    Ok(dbg!(DiffTree2TreeInfo {
      has_changes: total_deletions + total_additions > 0,
      added: total_additions,
      deleted: total_deletions,
      files,
    }))
  }
}

*/
