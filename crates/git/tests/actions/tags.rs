use test_utils::git::*;
use test_utils::*;


#[rstest]
fn find_tag_by_name(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let commit = repo.commit("1")?;
  let signature = TestCreds.signature()?;

  repo.repo().tag("tag-1", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
  repo.repo().tag("dir/tag", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
  repo.repo().tag_lightweight("dir/tag-2", &repo.repo().find_object(commit, None)?, true)?;

  let _ = repo.find_tag_tree_by_name("tag-1")?;
  let _ = repo.find_tag_tree_by_name("dir/tag")?;
  let _ = repo.find_tag_tree_by_name("dir/tag-2")?;

  Ok(())
}
