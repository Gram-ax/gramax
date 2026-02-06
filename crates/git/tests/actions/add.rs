use test_utils::git::*;
use test_utils::*;

#[rstest]
pub fn add_delete(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "content")?;
	fs::create_dir(sandbox.path().join("dir"))?;
	fs::write(sandbox.path().join("dir/file2"), "content")?;

	repo.add_glob(vec!["file", "dir/file2"])?;

	let status = repo.status(true)?.short_info()?;
	let mut entries = status.entries().iter();

	assert_eq!(entries.next().unwrap().path, Path::new("dir/file2"));
	assert_eq!(entries.next().unwrap().path, Path::new("file"));

	repo.commit_debug()?;

	fs::write(sandbox.path().join("new-file"), "content")?;
	fs::remove_dir_all(sandbox.path().join("dir"))?;
	repo.add_glob(vec!["file", "new-file", "dir", "not-exists"])?;

	let status = repo.status(true)?.short_info()?;
	let mut entries = status.entries().iter();

	let del_dir = entries.next().unwrap();
	assert_eq!(del_dir.path, Path::new("dir/file2"));
	assert_eq!(del_dir.status, StatusEntry::Delete);

	let new = entries.next().unwrap();
	assert_eq!(new.path, Path::new("new-file"));
	assert_eq!(new.status, StatusEntry::New);

	assert!(entries.next().is_none());

	fs::remove_file(sandbox.path().join("file"))?;
	repo.add_glob(vec!["file"])?;

	let status = repo.status(true)?.short_info()?;
	let mut entries = status.entries().iter();

	assert!(entries.any(|e| e.path.eq(Path::new("file"))));

	Ok(())
}

#[rstest]
pub fn add_resolve_rename(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "content")?;
	fs::create_dir(sandbox.path().join("dir"))?;
	fs::write(sandbox.path().join("dir/file2"), "content")?;
	fs::write(sandbox.path().join("dir/file"), "content")?;

	repo.add_glob(vec!["file", "dir"])?;

	let status = repo.status(true)?.short_info()?;
	let mut entries = status.entries().iter();

	assert_eq!(entries.next().unwrap().path, Path::new("dir/file"));
	assert_eq!(entries.next().unwrap().path, Path::new("dir/file2"));
	assert_eq!(entries.next().unwrap().path, Path::new("file"));

	repo.commit_debug()?;

	fs::rename(sandbox.path().join("dir"), sandbox.path().join("dir_2"))?;

	repo.add_glob(vec!["dir", "dir_2"])?;

	let status = repo.status(true)?.short_info()?;
	let expect = vec![
		StatusInfoEntry {
			path: PathBuf::from("dir/file"),
			status: StatusEntry::Delete,
		},
		StatusInfoEntry {
			path: PathBuf::from("dir/file2"),
			status: StatusEntry::Delete,
		},
		StatusInfoEntry {
			path: PathBuf::from("dir_2/file"),
			status: StatusEntry::New,
		},
		StatusInfoEntry {
			path: PathBuf::from("dir_2/file2"),
			status: StatusEntry::New,
		},
	];

	for entry in expect {
		assert!(status.entries().contains(&entry));
	}

	Ok(())
}
