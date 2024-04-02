/**
 * @jest-environment node
 */

import { setTimeout } from "timers/promises";
import DiskFileProvider from "../../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import TestGitRepository from "../../../../test/TestGitRepository";
import GitVersionControl from "../../../GitVersionControl/GitVersionControl";
import SyncGitMergeConflictResolver from "../SyncGitMergeConflictResolver";

const rep = new TestGitRepository(__dirname);
const dfp = new DiskFileProvider(__dirname);

let syncGitMergeConflictResolver: SyncGitMergeConflictResolver;

describe("SyncGitMergeConflictResolver", () => {
	beforeEach(async () => {
		await rep.init();
		syncGitMergeConflictResolver = new SyncGitMergeConflictResolver(
			new GitVersionControl({ corsProxy: null }, new Path(rep.repDir), dfp),
			dfp,
			new Path(rep.repDir),
		);
	});
	afterEach(async () => {
		await setTimeout(100);
		rep.clear();
		(syncGitMergeConflictResolver as any) = null;
	});

	it("заглушка", () => {});
	// TODO: пофиксить
	// it("Прерывает слияние", async () => {
	// 	await rep.commit({ "conflict.md": "content 1", "2.md": "content 2" });
	// 	await dfp.write(rep.path("conflict.md"), "conflict content ours");
	// 	const hashBefore = await rep.getCurrentHash();
	// 	const statusBefore = await rep.getStatus();
	// 	await makeConflict(rep);

	// 	await syncGitMergeConflictResolver.abortMerge(rep.source, new GitStash("stash"));

	// 	expect(await rep.getStatus()).toEqual(statusBefore);
	// 	expect(await rep.getCurrentHash()).toEqual(hashBefore);
	// 	expect(await rep.getAllBranches()).toEqual(["master"]);
	// });

	// it("Решает конфликт", async () => {
	// 	await rep.commit({ "conflict.md": "content 1", "2.md": "content 2" });
	// 	await dfp.write(rep.path("conflict.md"), "conflict content ours");
	// 	await makeConflict(rep);
	// 	const conflictFiles = [
	// 		{ content: "conflict content ours and theirs :)", path: "conflict.md", type: FileStatus.conflict },
	// 	];

	// 	await expect(
	// 		syncGitMergeConflictResolver.resolveConflictedFiles(conflictFiles, new GitStash("stash")),
	// 	).resolves.toBeUndefined();
	// 	expect(await dfp.read(rep.path("conflict.md"))).toBe("conflict content ours and theirs :)");
	// 	expect(await rep.getAllBranches()).toEqual(["master"]);
	// });
});

const makeConflict = async (rep: TestGitRepository) => {
	await rep.createNewBranch("stash");
	await rep.add({ "conflict.md": null });
	await rep.commit();
	await rep.checkout("master");
	await rep.commit({ "conflict.md": "conflict content theirs" });
	try {
		await rep.mergeBranches("master", "stash");
	} catch {}
};
