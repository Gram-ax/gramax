use gramaxgit::creds::Creds;
use gramaxgit::creds::DummyCreds;
use gramaxgit::prelude::*;

use tempdir::*;

use std::fs;

use test_utils::git::*;
use test_utils::*;

#[rstest]
fn read_content(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add("file")?;
  repo.commit("commit")?;

  let content = repo.read_tree_head()?.read_to_string("file")?;
  assert_eq!(content, "content");
  Ok(())
}

#[rstest]
fn read_content_not_exists(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let content = repo.read_tree_head()?.read_to_string("file");
  assert!(content.is_err());
  Ok(())
}

#[rstest]
fn read_dir(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::create_dir_all(sandbox.path().join("dir/dir"))?;
  fs::write(sandbox.path().join("dir/file"), "content")?;
  fs::write(sandbox.path().join("dir/dir/file"), "content2")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit")?;

  let dir = repo.read_tree_head()?.read_dir("dir")?.iter().map(|d| d.name.to_string()).collect::<Vec<_>>();
  assert_eq!(dir, ["dir", "file"]);
  Ok(())
}

#[rstest]
fn read_dir_not_exists(_sandbox: TempDir, #[with(&_sandbox)] repo: Repo<TestCreds>) -> Result {
  let dir = repo.read_tree_head()?.read_dir("dir");
  assert!(dir.is_err());
  Ok(())
}

#[rstest]
fn read_dir_file(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit")?;

  let dir = repo.read_tree_head()?.read_dir("file");
  assert!(dir.is_err());
  Ok(())
}

#[rstest]
fn read_tag(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["*"].iter())?;
  let oid = repo.commit("commit")?;
  repo.repo().tag("tag", &repo.repo().find_object(oid, None)?, &DummyCreds.signature()?, "commit", true)?;

  fs::remove_file(sandbox.path().join("file"))?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit 2")?;

  assert!(!repo.read_tree_head()?.exists("file")?);
  assert!(repo.read_tree_reference("refs/tags/tag")?.exists("file")?);

  let tag = repo.read_tree_reference("refs/tags/tag")?.read_to_string("file")?;
  assert_eq!(tag, "content");
  Ok(())
}

#[rstest]
fn stat_file(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit")?;

  let stat = repo.read_tree_head()?.stat("file")?;
  assert_eq!(stat.size, 7);
  assert!(!stat.is_dir);
  assert!(!stat.is_binary);
  Ok(())
}

#[rstest]
fn stat_dir(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  fs::create_dir(sandbox.path().join("dir"))?;
  fs::write(sandbox.path().join("dir/file"), "content")?;
  repo.add_glob(["*"].iter())?;
  repo.commit("commit")?;

  let stat = repo.read_tree_head()?.stat("dir")?;
  assert!(stat.is_dir);
  assert_eq!(stat.size, 0);
  assert!(!stat.is_binary);
  Ok(())
}

#[rstest]
fn read_from_reference(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  repo.new_branch("dev")?;

  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["*"].iter())?;
  let oid = repo.commit("commit")?;

  repo.repo().tag("q", &repo.repo().find_object(oid, None)?, &TestCreds.signature()?, "commit", true)?;
  repo.repo().tag_lightweight("w", &repo.repo().find_object(oid, None)?, true)?;

  let branch = repo.read_tree_reference("refs/heads/dev")?;
  assert!(branch.exists("file")?);
  assert_eq!(branch.read_to_string("file")?, "content");

  let tag = repo.read_tree_reference("refs/tags/q")?;
  assert!(tag.exists("file")?);
  assert_eq!(tag.read_to_string("file")?, "content");

  let tag = repo.read_tree_reference("refs/tags/w")?;
  assert!(tag.exists("file")?);
  assert_eq!(tag.read_to_string("file")?, "content");

  let branch = repo.read_tree_reference("refs/heads/master")?;
  assert!(!branch.exists("file")?);

  Ok(())
}

#[rstest]
fn read_from_short_reference(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
  repo.new_branch("dev")?;

  fs::write(sandbox.path().join("file"), "content")?;
  repo.add_glob(["*"].iter())?;
  let oid = repo.commit("commit")?;

  repo.repo().tag("q", &repo.repo().find_object(oid, None)?, &TestCreds.signature()?, "commit", true)?;
  repo.repo().tag_lightweight("w", &repo.repo().find_object(oid, None)?, true)?;

  let branch = repo.read_tree_reference("dev")?;
  assert!(branch.exists("file")?);
  assert_eq!(branch.read_to_string("file")?, "content");

  let tag = repo.read_tree_reference("q")?;
  assert!(tag.exists("file")?);
  assert_eq!(tag.read_to_string("file")?, "content");

  let tag = repo.read_tree_reference("w")?;
  assert!(tag.exists("file")?);
  assert_eq!(tag.read_to_string("file")?, "content");

  let branch = repo.read_tree_reference("master")?;
  assert!(!branch.exists("file")?);

  Ok(())
}
