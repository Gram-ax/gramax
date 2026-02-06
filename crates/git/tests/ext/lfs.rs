use std::cell::RefCell;
use std::rc::Rc;
use std::str::FromStr;

use test_utils::git::*;
use test_utils::*;

#[tokio::test(flavor = "multi_thread")]
#[rstest]
async fn lfs_clone_skip_lfs_pull(sandbox: TempDir) -> Result {
	Repo::clone(
		TestCreds,
		CloneOptions {
			url: "https://github.com/pashokitsme/test-lfs".into(),
			to: sandbox.path().to_path_buf(),
			branch: None,
			depth: None,
			cancel_token: 0,
			allow_non_empty_dir: false,
			is_bare: false,
			skip_lfs_pull: true,
		},
		Rc::new(|_| {}),
	)
	.unwrap();

	let repo = Repo::open(sandbox.path(), TestCreds).unwrap();

	repo.add_remote("origin", "https://github.com/pashokitsme/test-lfs").unwrap();

	let hello_bin = sandbox.path().join("hello.bin");
	assert!(hello_bin.exists());

	let content = fs::read_to_string(&hello_bin).unwrap();
	let git_content = repo.read_tree_head().unwrap().read_to_string("hello.bin").unwrap();
	assert_eq!(content, git_content);

	let pointer = git2_lfs::Pointer::from_str(&content).unwrap();

	let lfs_objects_path = repo.repo().path().join("lfs/objects").join(pointer.path());
	assert!(!lfs_objects_path.exists());

	let statuses = repo.status(false)?;
	assert_eq!(statuses.len(), 0);

	let lfs_callback_hit = RefCell::new(0);

	repo
		.pull_lfs_objects_exact(
			vec![PathBuf::from("hello.bin")],
			true,
			Some(Box::new(|progress| {
				info!(?progress);
				*lfs_callback_hit.borrow_mut() += 1;
			})),
			0.into(),
		)
		.unwrap();

	assert!(*lfs_callback_hit.borrow() > 0);

	let statuses = repo.status(false)?;
	assert_eq!(*statuses.short_info().unwrap().entries(), vec![]);

	assert!(lfs_objects_path.exists());

	let lfs_content = fs::read_to_string(&lfs_objects_path).unwrap();
	assert_eq!(std::fs::read_to_string(&hello_bin).unwrap(), lfs_content);

	Ok(())
}
