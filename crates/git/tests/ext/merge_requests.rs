use test_utils::git::*;
use test_utils::*;

#[rstest]
fn list_merge_requests(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  let prepare = |target: &str| -> Result {
    std::fs::create_dir_all(local_path.join(".gramax/mr"))?;
    std::fs::write(
      local_path.join(".gramax/mr/open.yaml"),
      format!(
        r#"
title: test1
targetBranch: {target}
creator: test <test@test.com>
createdAt: "1"
"#,
      ),
    )?;
    local.add(".gramax/mr/open.yaml")?;
    local.commit_debug()?;
    local.push()?;

    Ok(())
  };

  local.new_branch("dev")?;
  prepare("master")?;

  let mrs = local.list_merge_requests()?;
  assert_eq!(mrs.len(), 1);

  let mr = mrs.first().unwrap();
  assert_eq!(mr.title(), Some("test1"));
  assert_eq!(mr.source(), "dev");
  assert_eq!(mr.target(), "master");

  Ok(())
}

#[rstest]
fn create_merge_request_same_branch(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  let Err(err) = local.create_or_update_merge_request(CreateMergeRequest {
    title: Some("test1".to_string()),
    target_branch_ref: "master".to_string(),
    ..Default::default()
  }) else {
    panic!("error expected")
  };

  match err {
    gramaxgit::error::Error::Git(err)
      if err.code() == git2::ErrorCode::Invalid && err.class() == git2::ErrorClass::Reference => {}
    err => panic!("unexpected error: {:?}", err),
  }

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  Ok(())
}

#[rstest]
fn create_merge_request_invalid_branch(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  let Err(err) = local.create_or_update_merge_request(CreateMergeRequest {
    title: Some("test1".to_string()),
    target_branch_ref: "not-exists".to_string(),
    ..Default::default()
  }) else {
    panic!("error expected")
  };

  match err {
    gramaxgit::error::Error::Git(err)
      if err.code() == git2::ErrorCode::NotFound && err.class() == git2::ErrorClass::Reference => {}
    err => panic!("unexpected error: {:?}", err),
  }

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  Ok(())
}

#[rstest]
fn create_merge_request(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  local.new_branch("dev")?;
  local.push()?; // should exist at remote
  local.checkout("master", true)?;

  local.create_or_update_merge_request(CreateMergeRequest {
    title: Some("test1".to_string()),
    target_branch_ref: "dev".to_string(),
    ..Default::default()
  })?;

  local.add(".gramax/mr/open.yaml")?;
  local.commit_debug()?;
  local.push()?;

  assert!(std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert_eq!(local.list_merge_requests()?.len(), 1);

  Ok(())
}

#[rstest]
fn update_merge_request(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  local.new_branch("dev")?;
  local.push()?;
  local.checkout("master", true)?;

  local.create_or_update_merge_request(CreateMergeRequest {
    title: Some("test1".to_string()),
    target_branch_ref: "dev".to_string(),
    ..Default::default()
  })?;

  local.add(".gramax/mr/open.yaml")?;
  local.commit_debug()?;
  local.push()?;

  assert!(std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert_eq!(local.list_merge_requests()?.len(), 1);

  local.create_or_update_merge_request(CreateMergeRequest {
    title: Some("test2".to_string()),
    target_branch_ref: "dev".to_string(),
    description: Some("desc".to_string()),
    ..Default::default()
  })?;

  assert!(std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);

  let draft_mr = local.get_draft_merge_request()?.unwrap();
  assert_eq!(draft_mr.title(), Some("test2"));
  assert_eq!(draft_mr.description(), Some("desc"));

  local.add(".gramax/mr/open.yaml")?;
  local.commit_debug()?;
  local.push()?;

  let mrs = local.list_merge_requests()?;
  assert_eq!(mrs.len(), 1);
  let mr = mrs.first().unwrap();
  assert_eq!(mr.title(), Some("test2"));
  assert_eq!(mr.description(), Some("desc"));

  Ok(())
}

#[rstest]
fn get_draft_merge_request_no_head(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  assert!(!std::fs::exists(local_path.join(".gramax/mr/open.yaml"))?);
  assert!(local.list_merge_requests()?.is_empty());

  let mr = local.get_draft_merge_request()?;
  assert!(mr.is_none());

  std::fs::create_dir_all(local_path.join(".gramax/mr"))?;
  std::fs::write(
    local_path.join(".gramax/mr/open.yaml"),
    r#"
title: test1
targetBranch: develop
creator: test <test@test.com>
createdAt: "1"
"#,
  )?;

  local.repo().branch("develop", &local.repo().head()?.peel_to_commit()?, false)?;

  let mr = local.get_draft_merge_request()?;
  assert!(mr.is_some());

  Ok(())
}

#[rstest]
fn get_draft_merge_request_with_head(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let Repos { local, local_path, .. } = repos;

  std::fs::create_dir_all(local_path.join(".gramax/mr"))?;
  std::fs::write(
    local_path.join(".gramax/mr/open.yaml"),
    r#"
title: test1
targetBranch: dev
creator: test <test@test.com>
createdAt: "1"
"#,
  )?;

  local.add(".gramax/mr/open.yaml")?;
  local.commit_debug()?;
  local.push()?;

  local.repo().branch("dev", &local.repo().head()?.peel_to_commit()?, false)?;

  let mr = local.get_draft_merge_request()?;
  assert!(mr.is_some());

  std::fs::write(
    local_path.join(".gramax/mr/open.yaml"),
    r#"
title: test1
targetBranch: dev-2
creator: test <test@test.com>
createdAt: "1"
"#,
  )?;

  local.repo().branch("dev-2", &local.repo().head()?.peel_to_commit()?, false)?;

  let mr = local.get_draft_merge_request()?;
  assert!(mr.is_some());
  assert_eq!(mr.unwrap().target(), "dev-2");

  Ok(())
}

#[rstest]
fn create_merge_request_target_branch_only_local(
  _sandbox: TempDir,
  #[with(&_sandbox)] repos: Repos,
) -> Result {
  let Repos { local, .. } = repos;

  local.new_branch("local-only")?;
  local.new_branch("dev")?;

  local.create_or_update_merge_request(CreateMergeRequest {
    title: Some("test1".to_string()),
    target_branch_ref: "local-only".to_string(),
    ..Default::default()
  })?;

  let mr = local.get_draft_merge_request()?;
  assert!(mr.is_some());
  let mr = mr.unwrap();
  assert_eq!(mr.title(), Some("test1"));
  assert_eq!(mr.source(), "dev");
  assert_eq!(mr.target(), "local-only");

  Ok(())
}

#[rstest]
fn signature_onelinear_deserialize_test() -> Result {
  let signature = SinglelineSignature { name: "test".to_string(), email: "test@test.com".to_string() };
  let serialized = serde_yml::to_string(&signature)?;
  assert_eq!(serialized, "test <test@test.com>\n");
  let deserialized: SinglelineSignature = serde_yml::from_str(&serialized)?;
  assert_eq!(deserialized, signature);
  Ok(())
}
