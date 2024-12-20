use serde::Deserialize;
use serde::Serialize;

use git2::ErrorClass;
use git2::ErrorCode;

use crate::creds::*;
use crate::prelude::*;

use crate::error::Error;
use crate::error::Result;

const TAG: &str = "git:merge_requests";

pub type RawIsoDateTime = String;

pub trait MergeRequestExt {
  fn list_merge_requests(&self) -> Result<Vec<MergeRequest>>;
  fn get_draft_merge_request(&self) -> Result<Option<MergeRequest>>;
}

pub trait MergeRequestManageExt<C: ActualCreds> {
  fn create_or_update_merge_request(&self, opts: CreateMergeRequest) -> Result<()>;
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MergeRequestOptions {
  #[serde(default = "default_delete_after_merge")]
  pub(crate) delete_after_merge: bool,
}

fn default_delete_after_merge() -> bool {
  false
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalSignature {
  pub(crate) signature: SinglelineSignature,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) approved_at: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MergeRequest {
  pub(crate) target_branch_ref: String,
  pub(crate) source_branch_ref: String,

  pub(crate) title: Option<String>,
  pub(crate) description: Option<String>,

  pub(crate) author: SinglelineSignature,
  pub(crate) assignees: Vec<ApprovalSignature>,

  #[serde(rename = "createdAt")]
  created_at: RawIsoDateTime,
  #[serde(rename = "updatedAt")]
  updated_at: RawIsoDateTime,

  pub(crate) options: Option<MergeRequestOptions>,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OpenMergeRequest {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) title: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) description: Option<String>,

  #[serde(rename = "target")]
  pub(crate) target_branch_ref: String,

  pub(crate) author: SinglelineSignature,

  #[serde(default)]
  pub(crate) assignees: Vec<ApprovalSignature>,

  #[serde(rename = "createdAt")]
  #[serde(default)]
  created_at: RawIsoDateTime,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) options: Option<MergeRequestOptions>,
}

#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateMergeRequest {
  pub target_branch_ref: String,
  pub assignees: Option<Vec<ApprovalSignature>>,
  pub title: Option<String>,
  pub description: Option<String>,
  pub created_at: Option<RawIsoDateTime>,
  pub options: Option<MergeRequestOptions>,
}

impl MergeRequest {
  pub fn from_open_dto(source_branch_ref: String, open_mr: OpenMergeRequest) -> Self {
    Self {
      source_branch_ref,
      target_branch_ref: open_mr.target_branch_ref,
      title: open_mr.title,
      description: open_mr.description,
      author: open_mr.author,
      assignees: open_mr.assignees,
      created_at: open_mr.created_at.clone(),
      updated_at: open_mr.created_at, // TODO: resolve updated_at & remove .clone()
      options: open_mr.options,
    }
  }

  pub fn title(&self) -> Option<&str> {
    self.title.as_deref()
  }

  pub fn description(&self) -> Option<&str> {
    self.description.as_deref()
  }

  pub fn source(&self) -> &str {
    &self.source_branch_ref
  }

  pub fn target(&self) -> &str {
    &self.target_branch_ref
  }
}

impl<C: Creds> MergeRequestExt for Repo<C> {
  fn list_merge_requests(&self) -> Result<Vec<MergeRequest>> {
    let mut mrs = vec![];

    for branch in self.branches(Some(BranchType::Remote))? {
      let branch = branch?.0;
      let branch_ref_raw = branch.get().name().ok_or(crate::error::Error::Utf8)?;

      if branch_ref_raw.contains("HEAD") || !branch_ref_raw.contains("refs/remotes/origin") {
        continue;
      }

      let branch_ref = branch_ref_raw
        .strip_prefix("refs/remotes/origin/")
        .expect("branch ref should start with refs/remotes/origin/");

      let tree = self.read_tree_reference(branch_ref_raw)?;

      let mr_yaml_bytes = if tree.exists(".gramax/mr/open.yaml")? {
        tree.read_to_vec(".gramax/mr/open.yaml")?
      } else if tree.exists(".gramax/mr/open.yml")? {
        tree.read_to_vec(".gramax/mr/open.yml")?
      } else {
        continue;
      };

      let open_mr = match serde_yml::from_slice::<OpenMergeRequest>(mr_yaml_bytes.as_slice()) {
        Ok(mr) => mr,
        Err(err) => {
          error!(target: TAG, "failed to parse merge-request yaml at ref {}: {}", branch_ref_raw, err.to_string());
          continue;
        }
      };

      if self.branch_by_name(&open_mr.target_branch_ref, BranchType::Remote).is_err() {
        warn!(target: TAG, "in merge-request {} -> {}, the target branch does not exist; skipping", branch_ref, open_mr.target_branch_ref);
        continue;
      }

      if open_mr.target_branch_ref == branch_ref {
        warn!(target: TAG, "in merge-request {} -> {}, the target branch is the same as the source branch; skipping", branch_ref, open_mr.target_branch_ref);
        continue;
      }

      mrs.push(MergeRequest::from_open_dto(branch_ref.to_string(), open_mr));
    }

    info!(target: TAG, "resolved {} open merge-requests in total", mrs.len());

    Ok(mrs)
  }

  fn get_draft_merge_request(&self) -> Result<Option<MergeRequest>> {
    info!(target: TAG, "resolving draft merge-request at HEAD");

    let workdir_path = self.0.workdir().ok_or(Error::NoWorkdir)?;
    if !workdir_path.join(".gramax/mr/open.yaml").exists() {
      info!(target: TAG, "no draft merge-requests found at HEAD; no open.yaml file");
      return Ok(None);
    }

    let mr_bytes = std::fs::read(workdir_path.join(".gramax/mr/open.yaml"))?;
    let mr = serde_yml::from_slice::<OpenMergeRequest>(&mr_bytes)?;

    Ok(Some(MergeRequest::from_open_dto(self.0.head()?.shorthand().ok_or(Error::Utf8)?.to_string(), mr)))
  }
}

impl<C: ActualCreds> MergeRequestManageExt<C> for Repo<C> {
  fn create_or_update_merge_request(&self, opts: CreateMergeRequest) -> Result<()> {
    _ = self.0.find_branch(&format!("origin/{}", opts.target_branch_ref), BranchType::Remote).inspect_err(
      |_| error!(target: TAG, "failed to retrieve target remote branch origin/{}", opts.target_branch_ref),
    )?;

    if self.0.head()?.shorthand().ok_or(Error::Utf8)? == opts.target_branch_ref {
      return Err(
        git2::Error::new(
          ErrorCode::Invalid,
          ErrorClass::Reference,
          "source and target branches are the same",
        )
        .into(),
      );
    }

    let mr = OpenMergeRequest {
      title: opts.title,
      description: opts.description,
      target_branch_ref: opts.target_branch_ref,
      author: self.creds().signature()?.short_info()?,
      assignees: opts.assignees.unwrap_or_default(),
      created_at: opts.created_at.unwrap_or_default(),
      options: opts.options,
    };

    let workdir_path = self.0.workdir().ok_or(Error::NoWorkdir)?;
    let mr_path = workdir_path.join(".gramax/mr/open.yaml");

    if !mr_path.exists() {
      info!(target: TAG, "creating merge-request HEAD -> {}", mr.target_branch_ref);
      std::fs::create_dir_all(workdir_path.join(".gramax/mr"))?;
      std::fs::write(&mr_path, serde_yml::to_string(&mr)?)?;
      return Ok(());
    }

    let mut saved_mr = serde_yml::from_slice::<OpenMergeRequest>(&std::fs::read(&mr_path)?)?;

    info!(target: TAG, "updating merge-request HEAD -> {}", saved_mr.target_branch_ref);

    saved_mr.title = mr.title;
    saved_mr.description = mr.description;
    saved_mr.assignees = mr.assignees;
    saved_mr.options = mr.options;

    std::fs::write(&mr_path, serde_yml::to_string(&saved_mr)?)?;

    Ok(())
  }
}
