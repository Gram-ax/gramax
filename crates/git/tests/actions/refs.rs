use test_utils::git::*;
use test_utils::*;

#[rstest]
fn find_refs(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	let (commit, _) = repo.commit_debug()?;
	let signature = TestCreds.signature()?;

	repo
		.repo()
		.tag("tag-1", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
	repo
		.repo()
		.tag("dir/tag", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
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
	let (commit, _) = repo.commit_debug()?;
	let signature = TestCreds.signature()?;

	repo
		.repo()
		.tag("tag-1", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
	repo
		.repo()
		.tag("dir/tag", &repo.repo().find_object(commit, None)?, &signature, "message", false)?;
	repo.repo().tag_lightweight("dir/tag-2", &repo.repo().find_object(commit, None)?, true)?;

	let commit = repo.repo().head()?.peel_to_commit()?;
	repo.repo().branch("test", &commit, false)?;

	let refs = repo.find_refs_by_globs(&["master", "dir/*"])?;
	assert_eq!(refs.len(), 3); // 2 tags + 1 branch
	Ok(())
}

/// A branch that was never checked out here lives only in refs/remotes/<remote>/* — the shape of every
/// fresh clone, and of the bare clones a docportal serves. It is still a branch of this repository.
#[rstest]
fn find_refs_includes_remote_only_branches(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	repo.commit_debug()?;
	let commit = repo.repo().head()?.peel_to_commit()?;

	repo.repo().branch("releases/v1.0", &commit, false)?;
	repo.repo().reference("refs/remotes/origin/releases/v1.0", commit.id(), true, "test")?;
	repo.repo().reference("refs/remotes/origin/releases/v2.0", commit.id(), true, "test")?;
	repo.repo().reference("refs/remotes/origin/HEAD", commit.id(), true, "test")?;

	let mut names = repo
		.find_refs_by_globs(&["releases/*"])?
		.iter()
		.map(|r| match r {
			RefInfo::Tag { name, .. } | RefInfo::Branch { name, .. } => name.clone(),
		})
		.collect::<Vec<_>>();
	names.sort();

	// v1.0 exists both locally and remotely and must not be listed twice
	assert_eq!(names, vec!["releases/v1.0".to_string(), "releases/v2.0".to_string()]);
	Ok(())
}

/// The same branch name in two remotes: read_tree_reference reads the content from origin, so the
/// listed commit and date must come from origin as well.
#[rstest]
fn find_refs_prefers_origin_among_remotes(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	repo.commit_debug()?;
	let origin_commit = repo.repo().head()?.peel_to_commit()?.id();
	let (other_commit, _) = repo.commit_debug()?;

	// one remote sorts before origin, one after — origin wins either way
	repo.repo().reference("refs/remotes/mirror/releases/v3.0", other_commit, true, "test")?;
	repo.repo().reference("refs/remotes/origin/releases/v3.0", origin_commit, true, "test")?;
	repo.repo().reference("refs/remotes/upstream/releases/v3.0", other_commit, true, "test")?;

	let refs = repo.find_refs_by_globs(&["releases/*"])?;
	let refnames = refs
		.iter()
		.map(|r| match r {
			RefInfo::Tag { refname, .. } | RefInfo::Branch { refname, .. } => refname.clone(),
		})
		.collect::<Vec<_>>();

	assert_eq!(refnames, vec!["refs/remotes/origin/releases/v3.0".to_string()]);
	Ok(())
}
