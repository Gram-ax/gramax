use test_utils::git::*;
use test_utils::*;

#[rstest]
fn without_changes(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
	let diff = repos.local.count_changed_files("tracked")?;
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

	repos.local.add_all()?;
	repos.local.commit_debug()?;
	repos.local.repo().head()?.peel_to_commit()?;

	fs::write(repos.local_path.join("tracked/file2"), "changes changes changes")?;
	fs::write(repos.local_path.join("tracked/file3"), "fdasfa")?;

	repos.local.add_all()?;
	repos.local.commit_debug()?;

	let diff = repos.local.count_changed_files("tracked")?;
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

	repos.local.add_all()?;
	repos.local.commit_debug()?;

	fs::write(repos.local_path.join("tracked/file2"), "fdasfafdsa")?;

	repos.local.add_all()?;
	repos.local.commit_debug()?;
	repos.local.debug_push()?;

	repos.local.repo().reset(commit.as_object(), git2::ResetType::Hard, None)?;

	let diff = repos.local.count_changed_files("tracked")?;
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

	repos.local.add_all()?;
	repos.local.commit_debug()?;
	let commit = repos.local.repo().head()?.peel_to_commit()?;

	fs::write(repos.local_path.join("tracked/file2"), "changes changes changes")?;
	fs::write(repos.local_path.join("tracked/file3"), "fdasfa")?;

	repos.local.add_all()?;
	repos.local.commit_debug()?;
	repos.local.debug_push()?;

	repos.local.repo().reset(commit.as_object(), git2::ResetType::Hard, None)?;

	fs::write(repos.local_path.join("tracked/file2"), "qwerqwerqwerwqre")?;

	repos.local.add_all()?;
	repos.local.commit_debug()?;

	let diff = repos.local.count_changed_files("tracked")?;
	assert_eq!(diff.push, 1);
	assert_eq!(diff.pull, 2);
	assert!(diff.has_changes);

	Ok(())
}

#[rstest]
fn with_local_changes(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file1"), "hello1")?;
	fs::write(sandbox.path().join("file2"), "hello2")?;
	fs::write(sandbox.path().join("file3"), "hello3")?;

	fs::create_dir_all(sandbox.path().join("dir"))?;
	fs::write(sandbox.path().join("dir/file4"), "hello4")?;
	fs::write(sandbox.path().join("dir/file5"), "hello5")?;
	fs::write(sandbox.path().join("dir/file6"), "hello6")?;

	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("dir/created"), "created")?;
	fs::write(sandbox.path().join("file1"), "modified")?;

	repo.add_all()?;

	let count_changed_files = repo.count_changed_files("dir")?;
	assert_eq!(count_changed_files.changed, 1);
	assert_eq!(count_changed_files.push, 0);
	assert_eq!(count_changed_files.pull, 0);

	assert!(count_changed_files.has_changes);

	let count_changed_files = repo.count_changed_files("")?;
	assert_eq!(count_changed_files.changed, 2);
	assert_eq!(count_changed_files.push, 0);
	assert_eq!(count_changed_files.pull, 0);
	assert!(count_changed_files.has_changes);

	Ok(())
}
