use std::rc::Rc;

use gramaxgit::actions::merge::Merge;
use test_utils::git::*;
use test_utils::*;

#[rstest]
fn fastforward_merge(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let mut commits = vec!["init".to_string()];

	let path = sandbox.path().join("file");
	fs::write(&path, "content")?;
	repo.new_branch("other")?;
	repo.add_all()?;
	let (_, message) = repo.commit_debug()?;
	commits.push(message);
	fs::write(&path, "content222")?;
	repo.add_all()?;
	let (_, message) = repo.commit_debug()?;
	commits.push(message);

	assert!(path.exists());
	repo.checkout("master", false)?;
	assert!(!path.exists());
	repo.merge(MergeOptions::theirs("other"))?;
	assert!(path.exists());
	assert_eq!(fs::read_to_string(path)?, "content222");

	let mut revwalk = repo.repo().revwalk()?;
	revwalk.push_head()?;

	for (oid, commit_msg) in revwalk.zip(commits.iter().rev()) {
		let commit = repo.repo().find_commit(oid?)?;
		assert_eq!(commit.message().unwrap(), *commit_msg)
	}

	Ok(())
}

#[rstest]
fn normal_merge_no_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let mut commits = vec!["init".to_string()];

	let path = sandbox.path();
	fs::write(path.join("file1"), "123")?;
	repo.add("file1")?;
	let (_, message) = repo.commit_debug()?;
	commits.push(message);

	repo.new_branch("dev")?;
	fs::write(path.join("file2"), "123")?;
	repo.add("file2")?;
	let (_, message) = repo.commit_debug()?;
	commits.push(message);

	repo.checkout("master", false)?;
	fs::write(path.join("file3"), "file3")?;
	repo.add("file3")?;
	let (_, message) = repo.commit_debug()?;
	commits.push(message);

	repo.merge(MergeOptions::theirs("dev"))?;

	let mut revwalk = repo.repo().revwalk()?;
	revwalk.push_head()?;

	let merge_commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
	assert_eq!(merge_commit.parent_count(), 2);

	let commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
	assert!(commits.iter().any(|c| c == commit.message().unwrap()));

	let commit = repo.repo().find_commit(revwalk.next().unwrap()?)?;
	assert!(commits.iter().any(|c| c == commit.message().unwrap()));

	Ok(())
}

#[rstest]
fn normal_merge_with_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let path = sandbox.path();
	fs::write(path.join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.new_branch("dev")?;
	repo.checkout("dev", false)?;
	fs::write(path.join("file"), "dev\nd")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.checkout("master", false)?;
	fs::write(path.join("file"), "master\nd")?;
	repo.add("file")?;
	repo.commit_debug()?;

	let Ok(MergeResult::Conflicts(conflicts)) = repo.merge(MergeOptions::theirs("dev")) else {
		panic!("conflict was expected")
	};
	let conflict = conflicts.first().unwrap();
	assert_eq!(conflict.ours, conflict.theirs);
	assert_eq!(conflict.theirs, conflict.ancestor);
	assert_eq!(conflict.ancestor, Some(PathBuf::from("file")));

	const EXPECTED: &str = r#"<<<<<<< ours
master
=======
dev
>>>>>>> theirs
d"#;

	assert_eq!(fs::read_to_string(path.join("file"))?, EXPECTED);

	Ok(())
}

#[rstest]
fn merge_with_rename(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let path = sandbox.path();
	let file = Path::new("file");
	let file_2 = Path::new("file-2");

	fs::write(path.join(file), "qwer\nqwer\nqwer\nqwer\n")?;
	repo.add(file)?;
	repo.commit_debug()?;

	repo.new_branch("branch-2")?;
	fs::write(path.join(file_2), "123\nqwer\nqwer\nqwer\nqwer\n")?;
	fs::remove_file(path.join(file))?;
	repo.add_all()?;
	repo.commit_debug()?;

	assert!(!path.join(file).exists());
	assert!(path.join(file_2).exists());

	repo.checkout("master", false)?;

	assert!(path.join(file).exists());
	assert!(!path.join(file_2).exists());

	fs::write(path.join(file), "456\nqwer\nqwer\nqwer\nqwer\n")?;
	repo.add(file)?;
	repo.commit_debug()?;

	let Ok(MergeResult::Conflicts(res)) = repo.merge(MergeOptions::theirs("branch-2")) else {
		panic!("merge conflict was expected")
	};

	let mut res = res.into_iter();
	assert_eq!(res.next().unwrap().ours, Some(PathBuf::from("file")));
	assert_eq!(res.next().unwrap().theirs, Some(PathBuf::from("file-2")));

	assert_eq!(
		fs::read_to_string(path.join(file_2))?,
		"<<<<<<< ours:file\n456\n=======\n123\n>>>>>>> theirs:file-2\nqwer\nqwer\nqwer\nqwer\n"
	);
	assert!(!path.join(file).exists());

	Ok(())
}

#[rstest]
fn has_merge_conflicts_no_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let path = sandbox.path();

	fs::write(path.join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.new_branch("dev")?;
	repo.checkout("dev", false)?;
	fs::write(path.join("file_dev"), "dev only")?;
	repo.add("file_dev")?;
	repo.commit_debug()?;

	repo.checkout("master", false)?;
	fs::write(path.join("file_master"), "master only")?;
	repo.add("file_master")?;
	repo.commit_debug()?;

	let conflicts = repo.has_merge_conflicts("dev")?;
	assert!(conflicts.is_empty());

	Ok(())
}

#[rstest]
fn has_merge_conflicts_with_conflicts(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let path = sandbox.path();

	fs::write(path.join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.new_branch("dev")?;
	repo.checkout("dev", false)?;
	fs::write(path.join("file"), "dev content")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.checkout("master", false)?;
	fs::write(path.join("file"), "master content")?;
	repo.add("file")?;
	repo.commit_debug()?;

	let conflicts = repo.has_merge_conflicts("dev")?;
	assert_eq!(conflicts, vec![PathBuf::from("file")]);

	Ok(())
}

#[rstest]
fn has_merge_conflicts_multiple_files(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let path = sandbox.path();

	fs::write(path.join("a"), "init")?;
	fs::write(path.join("b"), "init")?;
	repo.add("a")?;
	repo.add("b")?;
	repo.commit_debug()?;

	repo.new_branch("dev")?;
	repo.checkout("dev", false)?;
	fs::write(path.join("a"), "dev-a")?;
	fs::write(path.join("b"), "dev-b")?;
	repo.add("a")?;
	repo.add("b")?;
	repo.commit_debug()?;

	repo.checkout("master", false)?;
	fs::write(path.join("a"), "master-a")?;
	fs::write(path.join("b"), "master-b")?;
	repo.add("a")?;
	repo.add("b")?;
	repo.commit_debug()?;

	let mut conflicts = repo.has_merge_conflicts("dev")?;
	conflicts.sort();
	assert_eq!(conflicts, vec![PathBuf::from("a"), PathBuf::from("b")]);

	Ok(())
}

#[rstest]
fn has_merge_conflicts_with_remote_branch(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
	// Create initial commit in remote and clone it
	fs::write(repos.remote_path.join("file"), "init")?;
	repos.remote.add_all()?;
	repos.remote.commit_debug()?;

	repos.local.repo().remote_delete("origin")?;
	repos.local.add_remote("origin", repos.remote_path.display().to_string())?;
	repos.local.fetch(RemoteOptions::default(), Rc::new(|_| {}))?;
	repos.local.checkout("master", false)?;

	// Make change in "file" in remote
	fs::write(repos.remote_path.join("file"), "remote content")?;
	repos.remote.add_all()?;
	repos.remote.commit_debug()?;

	// Make conflicting change in the same file (not committed) in local
	fs::write(repos.local_path.join("file"), "local content")?;
	repos.local.add_all()?;
	repos.local.commit_debug()?;

	// Fetch to update local remote-branch
	repos.local.fetch(RemoteOptions::default(), Rc::new(|_| {}))?;

	let conflicts = repos.local.has_merge_conflicts("origin/master")?;
	assert_eq!(conflicts, vec![PathBuf::from("file")]);

	Ok(())
}

#[rstest]
fn has_merge_conflicts_remote_no_conflicts(_sandbox: TempDir, #[with(&_sandbox)] repos: Repos) -> Result {
	fs::write(repos.remote_path.join("file"), "init")?;
	repos.remote.add_all()?;
	repos.remote.commit_debug()?;

	repos.local.repo().remote_delete("origin")?;
	repos.local.add_remote("origin", repos.remote_path.display().to_string())?;
	repos.local.fetch(RemoteOptions::default(), Rc::new(|_| {}))?;
	repos.local.checkout("master", false)?;

	// Remote adds new file
	fs::write(repos.remote_path.join("remote_file"), "remote only")?;
	repos.remote.add_all()?;
	repos.remote.commit_debug()?;

	// Local adds another file - no conflicts
	fs::write(repos.local_path.join("local_file"), "local only")?;
	repos.local.add_all()?;
	repos.local.commit_debug()?;

	repos.local.fetch(RemoteOptions::default(), Rc::new(|_| {}))?;

	let conflicts = repos.local.has_merge_conflicts("origin/master")?;
	assert!(conflicts.is_empty());

	Ok(())
}

#[rstest]
fn has_merge_conflicts_with_staged_changes(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let path = sandbox.path();

	fs::write(path.join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.new_branch("dev")?;
	repo.checkout("dev", false)?;
	fs::write(path.join("file"), "dev content")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.checkout("master", false)?;
	// staged but not committed change that conflicts with dev
	fs::write(path.join("file"), "master staged content")?;
	repo.add("file")?;

	let conflicts = repo.has_merge_conflicts("dev")?;
	assert_eq!(conflicts, vec![PathBuf::from("file")]);

	Ok(())
}
