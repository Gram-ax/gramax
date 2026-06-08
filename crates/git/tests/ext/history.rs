use gramaxgit::ext::history::CommitFilterOptions;
use gramaxgit::prelude::*;

use std::fs;

use test_utils::git::*;
use test_utils::*;

fn commit_at(repo: &Repo<TestCreds>, sandbox: &TempDir, content: &str, timestamp: i64) -> Result<Oid> {
	let filename = format!("file_{}", content.replace(' ', "_"));
	fs::write(sandbox.path().join(&filename), content)?;
	repo.add(&filename)?;

	let sig = Signature::new("test-user", "test@email.com", &git2::Time::new(timestamp, 0))?;
	let mut index = repo.repo().index()?;
	index.add_all(["."].iter(), git2::IndexAddOption::DEFAULT, None)?;
	let tree_oid = index.write_tree()?;
	index.write()?;
	let tree = repo.repo().find_tree(tree_oid)?;

	let head = repo.repo().head().ok().and_then(|h| h.peel_to_commit().ok());
	let parents: Vec<_> = head.iter().collect();

	let oid = repo.repo().commit(Some("HEAD"), &sig, &sig, content, &tree, &parents)?;
	Ok(oid)
}

#[rstest]
fn file_history(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;
	fs::write(sandbox.path().join("file"), "222")?;
	repo.commit_debug()?;
	repo.add("file")?;
	fs::write(sandbox.path().join("file_2"), "init")?;
	repo.add("file_2")?;
	repo.commit_debug()?;

	let diff = repo.history("file", 0, 10)?;

	assert_eq!(diff.len(), 2);
	Ok(())
}

#[rstest]
fn file_history_with_rename(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\ninit")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n123")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n222")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file"), "init\ninit\ninit\ninit\n333")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file_2"), "init\ninit\ninit\ninit\n555")?;
	fs::remove_file(sandbox.path().join("file"))?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file_2"), "init\ninit\ninit\ninit\n666")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file_3"), "init\ninit\ninit\ninit\n666")?;
	fs::remove_file(sandbox.path().join("file_2"))?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file_4"), "init\ninit\ninit\ninit\n777")?;
	fs::remove_file(sandbox.path().join("file_3"))?;
	repo.add_all()?;
	repo.commit_debug()?;

	let diff = repo.history("file_4", 0, 10)?;

	assert_eq!(diff.len(), 8);

	Ok(())
}

#[rstest]
fn get_all_branch_commiters_with_limit(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;

	repo.new_branch("feature")?;

	for i in 1..=5 {
		fs::write(sandbox.path().join("file"), format!("feature{i}"))?;
		repo.add("file")?;
		repo.commit_debug()?;
	}

	let commiters = repo.get_branch_commits("master", "feature", Some(3))?;

	assert_eq!(commiters.authors.len(), 1, "should have 1 author");
	assert_eq!(commiters.authors[0].count, 3, "should have 3 commits");
	assert_eq!(commiters.commits.len(), 3, "should have 3 commits");

	Ok(())
}

#[rstest]
fn get_all_branch_commiters_with_target_branch(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	// create a new branch and make commits on it
	repo.new_branch("feature")?;

	// make 3 commits on feature branch
	for i in 1..=3 {
		fs::write(sandbox.path().join("file"), format!("feature{i}"))?;
		repo.add("file")?;
		repo.commit_debug()?;
	}

	repo.checkout("master", true)?;

	std::fs::write(sandbox.path().join("file"), "master commit")?;
	repo.add("file")?;
	repo.commit(CommitOptions {
		message: "master commit".to_string(),
		parent_refs: None,
		files: None,
	})?;

	repo.checkout("feature", true)?;
	repo.merge(MergeOptions::theirs("master"))?;

	let commiters = repo.get_branch_commits("master", "feature", None)?;

	assert!(!commiters.commits.iter().any(|c| c == "master commit"));

	assert_eq!(commiters.authors.len(), 1, "should have 1 author");
	assert_eq!(commiters.authors[0].count, 3, "should have 3 commits (commits on feature)");
	assert_eq!(commiters.commits.len(), 3, "should have 3 commits (commits on feature)");

	Ok(())
}

#[rstest]
fn get_commit_info(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "init")?;
	repo.add("file")?;
	repo.commit_debug()?;

	let mut oids = Vec::new();

	// prepare
	for i in 1..=10 {
		fs::write(sandbox.path().join("file"), format!("init{i}"))?;
		repo.add("file")?;
		let info = repo.commit_debug()?;
		oids.push(info);
	}
	oids.reverse();

	// get commit info
	let head = repo.repo().head()?.peel_to_commit()?;
	let commit_info_only_head = repo.get_commit_info(head.id(), CommitInfoOpts { depth: 1, simplify: true, filters: None, include_changed_files: None })?;

	assert_eq!(commit_info_only_head.len(), 1);
	assert_eq!(commit_info_only_head.first().unwrap().oid, oids.first().unwrap().0.short_info()?);
	assert_eq!(commit_info_only_head.first().unwrap().summary, oids.first().unwrap().1);

	// get commit info with depth 10
	let commit_info_10 = repo.get_commit_info(head.id(), CommitInfoOpts { depth: 10, simplify: true, filters: None, include_changed_files: None })?;

	commit_info_10.iter().zip(&oids).for_each(|(info, oid)| {
		assert_eq!(
			info.oid,
			oid.0.short_info().unwrap(),
			"get commit info with depth 10: {} != {}",
			*info.oid,
			oid.0
		)
	});

	// get commit info depth 2 since specific commit
	let index = oids.len() / 2;
	let depth = 2;
	let oid = oids.get(index).unwrap().0;

	let commit_info_2 = repo.get_commit_info(oid, CommitInfoOpts { depth, simplify: true, filters: None, include_changed_files: None })?;

	commit_info_2.iter().zip(oids.iter().take(depth).skip(index)).for_each(|(info, oid)| {
		assert_eq!(
			info.oid,
			oid.0.short_info().unwrap(),
			"get commit info with depth 2 and index {}: {} != {}",
			index,
			*info.oid,
			oid.0
		)
	});

	Ok(())
}

#[rstest]
fn get_commit_info_stat(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("file"), "line1\nline2\nline3\n")?;
	repo.add("file")?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("file"), "line1\nline2\nchanged\n")?;
	repo.add("file")?;
	repo.commit_debug()?;

	let head = repo.repo().head()?.peel_to_commit()?;
	let commit_info = repo.get_commit_info(head.id(), CommitInfoOpts { depth: 3, simplify: true, filters: None, include_changed_files: None })?;

	assert_eq!(commit_info.len(), 3);

	let second_commit = &commit_info[0];
	assert_eq!(second_commit.stat.added, 1, "second commit should have 1 added line");
	assert_eq!(second_commit.stat.deleted, 1, "second commit should have 1 deleted line");

	let first_commit = &commit_info[1];
	assert_eq!(first_commit.stat.added, 3, "initial commit should have 3 added lines");
	assert_eq!(first_commit.stat.deleted, 0, "initial commit should have 0 deleted lines");

	Ok(())
}

const JAN_1: i64 = 1704067200;
const FEB_1: i64 = 1706745600;
const MAR_1: i64 = 1709251200;

#[rstest]
fn get_commit_info_filter_by_date(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	commit_at(&repo, &sandbox, "jan commit", JAN_1)?;
	commit_at(&repo, &sandbox, "feb commit", FEB_1)?;
	commit_at(&repo, &sandbox, "mar commit", MAR_1)?;

	let head = repo.repo().head()?.peel_to_commit()?;

	let result = repo.get_commit_info(
		head.id(),
		CommitInfoOpts {
			depth: 10,
			simplify: false,
			filters: Some(CommitFilterOptions {
				authors: None,
				after_date: Some("2024-01-01T00:00:00Z".to_string()),
				before_date: Some("2024-03-01T00:00:00Z".to_string()),
				paths: None,
			}),
			include_changed_files: None,
		},
	)?;

	assert_eq!(result.len(), 1, "should return only the february commit");
	assert_eq!(result[0].summary, "feb commit");

	Ok(())
}

#[rstest]
fn get_commit_info_filter_by_author(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	commit_at(&repo, &sandbox, "jan commit", JAN_1)?;
	commit_at(&repo, &sandbox, "feb commit", FEB_1)?;

	{
		let other_sig = Signature::new("other-user", "other@email.com", &git2::Time::new(MAR_1, 0))?;
		fs::write(sandbox.path().join("other_file"), "other")?;
		let mut index = repo.repo().index()?;
		index.add_all(["."].iter(), git2::IndexAddOption::DEFAULT, None)?;
		let tree_oid = index.write_tree()?;
		index.write()?;
		let tree = repo.repo().find_tree(tree_oid)?;
		let parent = repo.repo().head()?.peel_to_commit()?;
		repo.repo().commit(Some("HEAD"), &other_sig, &other_sig, "other commit", &tree, &[&parent])?;
	}

	let head = repo.repo().head()?.peel_to_commit()?;

	let result = repo.get_commit_info(
		head.id(),
		CommitInfoOpts {
			depth: 10,
			simplify: false,
			filters: Some(CommitFilterOptions {
				authors: Some(vec!["test@email.com".to_string()]),
				after_date: None,
				before_date: None,
				paths: None,
			}),
			include_changed_files: None,
		},
	)?;

	assert!(result.iter().all(|c| c.author.email == "test@email.com"), "should return only commits by test-user");
	assert!(!result.iter().any(|c| c.author.email == "other@email.com"), "should not return other-user commits");

	Ok(())
}

#[rstest]
fn get_commit_info_filter_after_date_stops_early(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	commit_at(&repo, &sandbox, "jan commit", JAN_1)?;
	commit_at(&repo, &sandbox, "feb commit", FEB_1)?;
	commit_at(&repo, &sandbox, "mar commit", MAR_1)?;

	let head = repo.repo().head()?.peel_to_commit()?;

	let result = repo.get_commit_info(
		head.id(),
		CommitInfoOpts {
			depth: 10,
			simplify: false,
			filters: Some(CommitFilterOptions {
				authors: None,
				after_date: Some("2024-02-01T00:00:00Z".to_string()),
				before_date: None,
				paths: None,
			}),
			include_changed_files: None,
		},
	)?;

	assert!(result.iter().any(|c| c.summary == "mar commit"), "should include mar commit");
	assert!(!result.iter().any(|c| c.summary == "feb commit"), "should not include feb commit");
	assert!(!result.iter().any(|c| c.summary == "jan commit"), "should not include jan commit");

	Ok(())
}

#[rstest]
fn get_commit_info_filter_by_paths(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	// commit touching "alpha"
	fs::write(sandbox.path().join("alpha"), "v1")?;
	repo.add_all()?;
	repo.commit_debug()?;

	// commit touching only "beta"
	fs::write(sandbox.path().join("beta"), "v1")?;
	repo.add_all()?;
	repo.commit_debug()?;

	// commit touching "alpha" again
	fs::write(sandbox.path().join("alpha"), "v2")?;
	repo.add_all()?;
	repo.commit_debug()?;

	let head = repo.repo().head()?.peel_to_commit()?;

	let result = repo.get_commit_info(
		head.id(),
		CommitInfoOpts {
			depth: 10,
			simplify: false,
			filters: Some(CommitFilterOptions {
				authors: None,
				after_date: None,
				before_date: None,
				paths: Some(vec!["alpha".to_string()]),
			}),
			include_changed_files: None,
		},
	)?;

	assert_eq!(result.len(), 2, "should return only commits that touched alpha");
	assert!(result.iter().all(|c| c.summary != "beta"), "beta-only commit should be excluded");

	Ok(())
}

#[rstest]
fn get_commit_info_filter_by_paths_multiple(sandbox: TempDir, #[with(&sandbox)] repo: Repo<TestCreds>) -> Result {
	fs::write(sandbox.path().join("alpha"), "v1")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("beta"), "v1")?;
	repo.add_all()?;
	repo.commit_debug()?;

	fs::write(sandbox.path().join("gamma"), "v1")?;
	repo.add_all()?;
	repo.commit_debug()?;

	let head = repo.repo().head()?.peel_to_commit()?;

	let result = repo.get_commit_info(
		head.id(),
		CommitInfoOpts {
			depth: 10,
			simplify: false,
			filters: Some(CommitFilterOptions {
				authors: None,
				after_date: None,
				before_date: None,
				paths: Some(vec!["alpha".to_string(), "beta".to_string()]),
			}),
			include_changed_files: None,
		},
	)?;

	assert_eq!(result.len(), 2, "should return commits touching alpha or beta");

	Ok(())
}

#[rstest]
fn get_commit_info_filter_by_paths_empty_paths_returns_all(
	sandbox: TempDir,
	#[with(&sandbox)] repo: Repo<TestCreds>,
) -> Result {
	for i in 1..=3 {
		fs::write(sandbox.path().join(format!("file{i}")), "content")?;
		repo.add_all()?;
		repo.commit_debug()?;
	}

	let head = repo.repo().head()?.peel_to_commit()?;

	let result = repo.get_commit_info(
		head.id(),
		CommitInfoOpts {
			depth: 10,
			simplify: false,
			filters: Some(CommitFilterOptions {
				authors: None,
				after_date: None,
				before_date: None,
				paths: Some(vec![]),
			}),
			include_changed_files: None,
		},
	)?;

	assert!(result.len() >= 3, "empty paths filter should not exclude any commits");

	Ok(())
}
