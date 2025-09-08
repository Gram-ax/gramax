use serde::Deserialize;
use serde::Serialize;

use git2::ErrorClass;
use git2::ErrorCode;

use crate::creds::*;
use crate::prelude::*;

use crate::error::Error;
use crate::error::OrUtf8Err;
use crate::error::Result;

const TAG: &str = "git:merge_requests";

pub type RawIsoDateTime = String;

const MERGE_REQUEST_DIR_PATH: &str = ".gramax/mr";
const MERGE_REQUEST_FILE_PATH: &str = ".gramax/mr/open.yaml";

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

  #[serde(default)]
  pub(crate) squash: bool,
}

fn default_delete_after_merge() -> bool {
  false
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalSignature {
  pub(crate) user: SinglelineSignature,
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

  pub(crate) creator: SinglelineSignature,
  pub(crate) approvers: Vec<ApprovalSignature>,

  #[serde(rename = "createdAt")]
  created_at: RawIsoDateTime,
  #[serde(rename = "updatedAt")]
  updated_at: RawIsoDateTime,

  pub(crate) options: Option<MergeRequestOptions>,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OpenMergeRequest {
  pub(crate) creator: SinglelineSignature,

  #[serde(rename = "targetBranch")]
  pub(crate) target_branch_ref: String,

  #[serde(rename = "createdAt")]
  #[serde(default)]
  created_at: RawIsoDateTime,

  #[serde(default)]
  pub(crate) approvers: Vec<ApprovalSignature>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) options: Option<MergeRequestOptions>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) title: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none")]
  pub(crate) description: Option<String>,
}

#[derive(Deserialize, Default, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CreateMergeRequest {
  pub target_branch_ref: String,
  pub approvers: Option<Vec<ApprovalSignature>>,
  pub title: Option<String>,
  pub description: Option<String>,
  pub created_at: Option<RawIsoDateTime>,
  pub options: Option<MergeRequestOptions>,

  #[serde(default)]
  pub force_create: bool,
}

impl MergeRequest {
  pub fn from_open_dto(source_branch_ref: String, open_mr: OpenMergeRequest) -> Self {
    Self {
      source_branch_ref,
      target_branch_ref: open_mr.target_branch_ref,
      title: open_mr.title,
      description: open_mr.description,
      creator: open_mr.creator,
      approvers: open_mr.approvers,
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

impl<C: Creds> MergeRequestExt for Repo<'_, C> {
  fn list_merge_requests(&self) -> Result<Vec<MergeRequest>> {
    let mut mrs = vec![];

    for branch in self.branches(Some(BranchType::Remote))? {
      let branch = branch?.0;
      let branch_ref_raw = branch.get().name().or_utf8_err()?;

      if branch_ref_raw.contains("HEAD") || !branch_ref_raw.contains("refs/remotes/origin") {
        continue;
      }

      let branch_ref = branch_ref_raw
        .strip_prefix("refs/remotes/origin/")
        .expect("branch ref should start with refs/remotes/origin/");

      let tree = self.read_tree_reference(branch_ref_raw)?;

      let mr_yaml_bytes = if tree.exists(MERGE_REQUEST_FILE_PATH)? {
        tree.read_to_vec(MERGE_REQUEST_FILE_PATH)?
      } else {
        debug!(target: TAG, "no merge-request file found at ref {branch_ref_raw}");
        continue;
      };

      let open_mr = match serde_yml::from_slice::<OpenMergeRequest>(mr_yaml_bytes.as_slice()) {
        Ok(mr) => mr,
        Err(err) => {
          error!(target: TAG, "failed to parse merge-request yaml at ref {branch_ref_raw}: {err}");
          continue;
        }
      };

      if self.branch_by_name(&open_mr.target_branch_ref, Some(BranchType::Remote)).is_err() {
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
    if !workdir_path.join(MERGE_REQUEST_FILE_PATH).exists() {
      info!(target: TAG, "no draft merge-requests found at HEAD; no open.yaml file");
      return Ok(None);
    }

    let mr_bytes = std::fs::read(workdir_path.join(MERGE_REQUEST_FILE_PATH))?;
    let mr = serde_yml::from_slice::<OpenMergeRequest>(&mr_bytes)?;

    let source_branch_ref = self.0.head()?.shorthand().or_utf8_err()?.to_string();

    if source_branch_ref == mr.target_branch_ref {
      warn!(target: TAG, "source and target branches are the same ({} -> {}); omitting draft merge-request", source_branch_ref, mr.target_branch_ref);
      return Ok(None);
    }

    self.ensure_branch_exists_local(&mr.target_branch_ref)?;

    Ok(Some(MergeRequest::from_open_dto(source_branch_ref, mr)))
  }
}

impl<C: ActualCreds> MergeRequestManageExt<C> for Repo<'_, C> {
  fn create_or_update_merge_request(&self, opts: CreateMergeRequest) -> Result<()> {
    self.ensure_branch_exists(&opts.target_branch_ref)?;

    if self.0.head()?.shorthand().or_utf8_err()? == opts.target_branch_ref {
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
      creator: self.creds().signature()?.short_info()?,
      approvers: opts.approvers.unwrap_or_default(),
      created_at: opts.created_at.unwrap_or_default(),
      options: opts.options,
    };

    let workdir_path = self.0.workdir().ok_or(Error::NoWorkdir)?;
    let mr_path = workdir_path.join(MERGE_REQUEST_FILE_PATH);

    if opts.force_create || !mr_path.exists() {
      info!(target: TAG, "creating merge-request HEAD -> {}", mr.target_branch_ref);
      std::fs::create_dir_all(workdir_path.join(MERGE_REQUEST_DIR_PATH))?;
      std::fs::write(&mr_path, serde_yml::to_string(&mr)?)?;
      return Ok(());
    }

    let mut saved_mr = serde_yml::from_slice::<OpenMergeRequest>(&std::fs::read(&mr_path)?)?;

    info!(target: TAG, "updating merge-request HEAD -> {}", saved_mr.target_branch_ref);

    saved_mr.title = mr.title;
    saved_mr.description = mr.description;
    saved_mr.approvers = mr.approvers;
    saved_mr.options = mr.options;

    std::fs::write(&mr_path, serde_yml::to_string(&saved_mr)?)?;

    Ok(())
  }
}
