use test_utils::git::*;
use test_utils::*;

#[rstest]
fn find_refs(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let commit = repo.commit("1")?;
  let signature = TestCreds.signature()?;

  repo.repo().tag("tag-1", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
  repo.repo().tag("dir/tag", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
  repo.repo().tag_lightweight("dir/tag-2", &repo.repo().find_object(commit, None)?, true)?;

  let commit = repo.repo().head()?.peel_to_commit()?;
  repo.repo().branch("test", &commit, false)?;

  let refs = repo.find_refs_by_globs(&["*"])?;
  assert_eq!(refs.len(), 5); // 3 tags + 2 branches

  let refs = repo.find_refs_by_globs(&["dir/*"])?;
  assert_eq!(refs.len(), 2); // 2 tags in dir

  let refs = repo.find_refs_by_globs(&["refs/heads/*"])?;
  assert_eq!(refs.len(), 2); // 2 branches
  Ok(())
}


#[rstest]
fn find_refs_multiple_globs(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let commit = repo.commit("1")?;
  let signature = TestCreds.signature()?;

  repo.repo().tag("tag-1", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
  repo.repo().tag("dir/tag", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
  repo.repo().tag_lightweight("dir/tag-2", &repo.repo().find_object(commit, None)?, true)?;

  let commit = repo.repo().head()?.peel_to_commit()?;
  repo.repo().branch("test", &commit, false)?;

  let refs = repo.find_refs_by_globs(&["master", "dir/*"])?;
  assert_eq!(refs.len(), 3); // 2 tags + 1 branch
  Ok(())
}
