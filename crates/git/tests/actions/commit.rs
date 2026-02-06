use test_utils::git::*;
use test_utils::*;

#[rstest]
fn commit(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "content")?;
	repo.add_glob(vec!["file"])?;
	let (_, message) = repo.commit_debug()?;

	let mut revwalk = repo.repo().revwalk()?;
	revwalk.push_head()?;
	let last_commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
	last_commit.tree()?.get_path(Path::new("file"))?;
	assert_eq!(last_commit.message().unwrap(), message);

	Ok(())
}

#[rstest]
fn commit_with_parents(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	repo.new_branch("test")?;
	repo.new_branch("test2")?;

	repo.checkout("master", true)?;
	let oid = repo.commit(CommitOptions {
		message: "message".to_string(),
		parent_refs: Some(vec!["test".to_string(), "test2".to_string()]),
		files: None,
	})?;
	assert_eq!(repo.repo().find_commit(oid)?.parent_count(), 2);
	Ok(())
}

#[rstest]
fn commit_no_modified(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "content").unwrap();
	assert!(repo.commit_debug().is_ok());
	Ok(())
}

#[rstest]
fn commit_with_parents_on_remote(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
	repos.local.new_branch("test")?;
	repos.local.debug_push()?;

	repos.local.checkout("master", true)?;
	let parents = vec!["master".to_string(), "origin/test".to_string()];
	let oid = repos.local.commit(CommitOptions {
		message: "message".to_string(),
		parent_refs: Some(parents),
		files: None,
	})?;

	assert_eq!(repos.local.repo().find_commit(oid)?.parent_count(), 2);
	Ok(())
}

#[rstest]
fn commit_with_specific_files(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(_sandbox.path().join("file1"), "content1")?;
	fs::write(_sandbox.path().join("file2"), "content2")?;
	fs::write(_sandbox.path().join("file3"), "content3")?;

	repo.add_glob(vec!["*"])?;

	let commit_opts = CommitOptions {
		message: "commit only file1 and file2".to_string(),
		parent_refs: None,
		files: Some(vec![PathBuf::from("file1"), PathBuf::from("file2")]),
	};
	let oid = repo.commit(commit_opts)?;

	let commit = repo.repo().find_commit(oid)?;
	let tree = commit.tree()?;
	assert!(tree.get_path(Path::new("file1")).is_ok());
	assert!(tree.get_path(Path::new("file2")).is_ok());
	assert!(tree.get_path(Path::new("file3")).is_err());

	Ok(())
}

#[rstest]
fn commit_with_specific_files_and_check_working_directory(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(_sandbox.path().join("file1"), "content1")?;
	fs::write(_sandbox.path().join("file2"), "content2")?;
	fs::write(_sandbox.path().join("file3"), "content3")?;

	repo.add_glob(vec!["*"])?;

	let commit_opts = CommitOptions {
		message: "commit only file1 and file2".to_string(),
		parent_refs: None,
		files: Some(vec![PathBuf::from("file1"), PathBuf::from("file2")]),
	};
	let oid = repo.commit(commit_opts)?;

	let commit = repo.repo().find_commit(oid)?;
	let tree = commit.tree()?;

	tree.get_path(Path::new("file1")).unwrap();
	tree.get_path(Path::new("file2")).unwrap();
	assert!(tree.get_path(Path::new("file3")).is_err());

	let status = repo.repo().statuses(None)?;
	let changed_files = status.iter().map(|s| s.path().unwrap().to_string()).collect::<Vec<_>>();
	assert_eq!(changed_files, vec!["file3"]);

	Ok(())
}

#[rstest]
fn commit_with_file_deletion(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(_sandbox.path().join("file1"), "content1")?;
	fs::write(_sandbox.path().join("file2"), "content2")?;
	fs::write(_sandbox.path().join("file3"), "content3")?;

	repo.add_glob(vec!["*"])?;

	let commit_opts = CommitOptions {
		message: "initial commit".to_string(),
		parent_refs: None,
		files: Some(vec![PathBuf::from("file1"), PathBuf::from("file2"), PathBuf::from("file3")]),
	};
	let oid = repo.commit(commit_opts)?;

	let commit = repo.repo().find_commit(oid)?;
	let tree = commit.tree()?;

	tree.get_path(Path::new("file1")).unwrap();
	tree.get_path(Path::new("file2")).unwrap();
	tree.get_path(Path::new("file3")).unwrap();

	fs::remove_file(_sandbox.path().join("file2"))?;
	repo.add_glob(vec!["*"])?;

	let commit_opts = CommitOptions {
		message: "delete file2".to_string(),
		parent_refs: None,
		files: Some(vec![PathBuf::from("file2")]),
	};
	let oid = repo.commit(commit_opts)?;

	let commit = repo.repo().find_commit(oid)?;
	let tree = commit.tree()?;

	assert!(tree.get_path(Path::new("file1")).is_ok());
	assert!(tree.get_path(Path::new("file2")).is_err());
	assert!(tree.get_path(Path::new("file3")).is_ok());

	let status = repo.repo().statuses(None)?;
	let changed_files = status.iter().map(|s| s.path().unwrap().to_string()).collect::<Vec<_>>();
	assert!(changed_files.is_empty());

	Ok(())
}
