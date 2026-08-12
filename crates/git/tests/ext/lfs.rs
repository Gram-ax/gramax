#![cfg(not(target_family = "wasm"))]

use std::cell::RefCell;
use std::rc::Rc;
use std::str::FromStr;

use test_utils::git::*;
use test_utils::*;

const OLD_OID: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NEW_OID: &str = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

fn pointer_text(oid: &str, size: usize) -> String {
	format!("version https://git-lfs.github.com/spec/v1\noid sha256:{oid}\nsize {size}\n")
}

#[rstest]
fn lfs_scoped_pointer_resolution_uses_commit_tree(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	let pointer_old = pointer_text(OLD_OID, 9);
	let pointer_new = pointer_text(NEW_OID, 9);

	fs::write(sandbox.path().join("img.bin"), &pointer_old)?;
	fs::write(sandbox.path().join("readme.md"), "plain text")?;
	repo.add_all()?;
	let (old_commit, _) = repo.commit_debug()?;

	fs::write(sandbox.path().join("img.bin"), &pointer_new)?;
	fs::write(sandbox.path().join("added-later.bin"), &pointer_new)?;
	repo.add_all()?;
	repo.commit_debug()?;

	let paths = vec![
		PathBuf::from("img.bin"),
		PathBuf::from("added-later.bin"),
		PathBuf::from("readme.md"),
		PathBuf::from("missing.bin"),
	];

	// added-later.bin is absent in the old tree, readme.md is not a pointer, missing.bin does not
	// exist at all -> only img.bin resolves; the object is not there yet, so a pull is attempted
	// and fails without a remote
	let scope = repo.read_tree_commit(old_commit)?;
	assert!(repo
		.pull_lfs_objects_exact(&paths, PointerSource::Tree(scope.tree()), None, 0.into())
		.is_err());

	// seed exactly the OLD oid: resolution from the working copy would still see the NEW one and pull
	let old_object = git2_lfs::Pointer::from_str(&pointer_old).unwrap();
	let object_path = repo.repo().path().join("lfs/objects").join(old_object.path());
	fs::create_dir_all(object_path.parent().unwrap())?;
	fs::write(&object_path, "old-bytes")?;

	repo.pull_lfs_objects_exact(&paths, PointerSource::Tree(scope.tree()), None, 0.into())?;

	let content = repo.read_tree_commit(old_commit)?.read_to_vec("img.bin")?;
	assert_eq!(content, b"old-bytes");

	assert_eq!(fs::read_to_string(sandbox.path().join("img.bin"))?, pointer_new);
	assert_eq!(repo.status(false)?.len(), 0);

	Ok(())
}

#[rstest]
fn lfs_scoped_pull_command_head_scope_keeps_exact_behavior(
	sandbox: TempDir,
	#[with(&sandbox)] repo: Repo<TestCreds>,
) -> Result {
	// HEAD scope resolves the pointer from the working copy, exactly as before
	let pointer = pointer_text(NEW_OID, 9);
	fs::write(sandbox.path().join("img.bin"), &pointer)?;
	repo.add_all()?;
	repo.commit_debug()?;

	let object_path = repo
		.repo()
		.path()
		.join("lfs/objects")
		.join(git2_lfs::Pointer::from_str(&pointer).unwrap().path());
	fs::create_dir_all(object_path.parent().unwrap())?;
	fs::write(&object_path, "new-bytes")?;

	drop(repo);

	gramaxgit::commands::pull_lfs_objects(
		sandbox.path(),
		gramaxgit::creds::AccessTokenCreds::new("test-user", "test@email.com", "", None, None),
		gramaxgit::commands::TreeReadScope::Head,
		vec![PathBuf::from("img.bin")],
		false,
		0.into(),
	)
	.unwrap();

	Ok(())
}

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
			&[PathBuf::from("hello.bin")],
			PointerSource::Workdir { checkout: true },
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
