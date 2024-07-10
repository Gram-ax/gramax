use test_utils::git::*;
use test_utils::*;

#[rstest]
fn without_changes(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  let diff = repos.local.graph_head_upstream_files("tracked")?;
  assert_eq!(diff.push, 0);
  assert_eq!(diff.pull, 0);
  assert!(!diff.has_changes);

  Ok(())
}

#[rstest]
fn with_push_changes(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  fs::write(repos.local_path.join("file1"), "non-tracked-file")?;
  fs::create_dir(repos.local_path.join("tracked"))?;
  fs::write(repos.local_path.join("tracked/file2"), "tracked-file")?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("1")?;
  repos.local.repo().head()?.peel_to_commit()?;

  fs::write(repos.local_path.join("tracked/file2"), "changes changes changes")?;
  fs::write(repos.local_path.join("tracked/file3"), "fdasfa")?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("2")?;

  let diff = repos.local.graph_head_upstream_files("tracked")?;
  assert_eq!(diff.push, 2);
  assert_eq!(diff.pull, 0);
  assert!(diff.has_changes);

  Ok(())
}

#[rstest]
fn with_pull_changes(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  fs::write(repos.local_path.join("file1"), "non-tracked-file")?;
  fs::create_dir(repos.local_path.join("tracked"))?;
  fs::write(repos.local_path.join("tracked/file2"), "tracked-file")?;

  let commit = repos.local.repo().head()?.peel_to_commit()?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("1")?;

  fs::write(repos.local_path.join("tracked/file2"), "fdasfafdsa")?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("2")?;
  repos.local.push()?;

  repos.local.repo().reset(commit.as_object(), git2::ResetType::Hard, None)?;

  let diff = repos.local.graph_head_upstream_files("tracked")?;
  assert_eq!(diff.push, 0);
  assert_eq!(diff.pull, 1);
  assert!(diff.has_changes);

  Ok(())
}

#[rstest]
fn with_pull_and_push_changes(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
  fs::write(repos.local_path.join("file1"), "non-tracked-file")?;
  fs::create_dir(repos.local_path.join("tracked"))?;
  fs::write(repos.local_path.join("tracked/file2"), "tracked-file")?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("1")?;
  let commit = repos.local.repo().head()?.peel_to_commit()?;

  fs::write(repos.local_path.join("tracked/file2"), "changes changes changes")?;
  fs::write(repos.local_path.join("tracked/file3"), "fdasfa")?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("2")?;
  repos.local.push()?;

  repos.local.repo().reset(commit.as_object(), git2::ResetType::Hard, None)?;

  fs::write(repos.local_path.join("tracked/file2"), "qwerqwerqwerwqre")?;

  repos.local.add_glob(["*"].iter())?;
  repos.local.commit("2")?;

  let diff = repos.local.graph_head_upstream_files("tracked")?;
  assert_eq!(diff.push, 1);
  assert_eq!(diff.pull, 2);
  assert!(diff.has_changes);

  Ok(())
}
