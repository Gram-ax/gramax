use std::rc::Rc;

use gramaxgit::ext::recover::Recover;
use gramaxgit::ext::walk::Walk;
use test_utils::git::*;
use test_utils::*;

const FILES: [&str; 7] = ["file1", "file2", "file3", "dir/file4", "dir/file5", "dir2/file6", "dir2/file7"];

pub fn fill_repo(repo: &mut Repo<TestCreds>) -> Result<Vec<Oid>> {
  let workdir = repo.repo().workdir().unwrap().to_path_buf();

  let mut oids = Vec::new();

  fs::create_dir_all(workdir.join("dir2"))?;
  fs::create_dir_all(workdir.join("dir"))?;

  for i in FILES {
    fs::write(workdir.join(i), format!("initial content of {}", i))?;
    repo.add_all()?;
  }

  let (oid, _) = repo.commit_debug()?;
  oids.push(oid);

  std::fs::write(workdir.join("stash-file"), "stash")?;
  repo.add("stash-file")?;
  let stash = repo.stash(Some("Stash"))?;
  oids.push(stash.unwrap());

  for i in FILES {
    fs::write(workdir.join(i), format!("modified content of {}", i))?;
    repo.add_all()?;
  }

  let (oid, _) = repo.commit_debug()?;
  oids.push(oid);

  for i in FILES {
    fs::write(workdir.join(i), format!("content of {}", i))?;
    repo.add_all()?;
    let (oid, _) = repo.commit_debug()?;
    oids.push(oid);
  }

  fs::remove_file(workdir.join("dir2/file6"))?;
  fs::remove_file(workdir.join("dir2/file7"))?;

  repo.commit_debug()?;

  repo.new_branch("branch1")?;
  repo.debug_push()?;
  repo.new_branch("branch2")?;
  repo.debug_push()?;

  repo.checkout("master", true)?;
  repo.debug_push()?;

  Ok(oids)
}

#[rstest]
pub fn recover(_sandbox: TempDir, #[with(&_sandbox)] mut repos: Repos) -> Result {
  let oids = fill_repo(&mut repos.local)?;

  assert!(repos.local.healthcheck()?.is_empty(), "healthcheck should not find corrupted objects");

  // remove some of the objects (including stash-related objects)
  repos.local.debug_remove_object(&oids[1..4])?;

  // refresh odb
  repos.local.reopen()?;

  let healthcheck = repos.local.healthcheck()?;
  assert!(!healthcheck.is_empty(), "healthcheck should find corrupted objects; got: {:?}", healthcheck);

  // recover
  repos.local.recover(0.into(), Rc::new(|_| {}))?;

  let healthcheck = repos.local.healthcheck()?;
  assert!(healthcheck.is_empty(), "healthcheck should not find corrupted objects; got: {:?}", healthcheck);

  // it's possible to add and push new file
  std::fs::write(repos.local_path.join("hi"), "hello")?;
  repos.local.add_all()?;
  repos.local.debug_push()?;

  // branch1 exists on remote
  let remote_branch = repos.remote.branch_by_name("branch1", None)?;
  assert_eq!(remote_branch.name()?.unwrap(), "branch1");

  // it's possible to checkout branch1
  repos.local.checkout("branch1", false)?;
  let branch = repos.local.branch_by_head()?;
  assert_eq!(branch.name()?.unwrap(), "branch1");

  repos.local.debug_push()?;

  Ok(())
}
