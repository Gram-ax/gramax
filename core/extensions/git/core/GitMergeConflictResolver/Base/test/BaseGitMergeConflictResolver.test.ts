/**
 * @jest-environment node
 */

import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { setTimeout } from "timers/promises";
import DiskFileProvider from "../../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import TestGitRepository from "../../../../test/TestGitRepository";
import GitVersionControl from "../../../GitVersionControl/GitVersionControl";
import { GitVersion } from "../../../model/GitVersion";
import BaseGitMergeConflictResolver from "../BaseGitMergeConflictResolver";

const rep = new TestGitRepository(__dirname);
const dfp = new DiskFileProvider(__dirname);

let baseGitMergeConflictResolver: BaseGitMergeConflictResolver;
const CONFLICT_CONTENT = `<<<<<<< master
conflict content ours=======
conflict content theirs>>>>>>> conflict
`;

describe("BaseGitMergeConflictResolver", () => {
	beforeEach(async () => {
		await rep.init();
		baseGitMergeConflictResolver = new BaseGitMergeConflictResolver(
			new GitVersionControl({ corsProxy: null }, new Path(rep.repDir), dfp),
			dfp,
			new Path(rep.repDir),
		);
	});
	afterEach(async () => {
		await setTimeout(100);
		rep.clear();
		(baseGitMergeConflictResolver as any) = null;
	});

	it("Прерывает слияние", async () => {
		await rep.commit({ "conflict.md": "content 1", "2.md": "content 2" });
		const hashBefore = await rep.getCurrentHash();
		const statusBefore = await rep.getStatus();
		await makeConflict(rep);

		await baseGitMergeConflictResolver.abortMerge(new GitVersion(hashBefore));

		expect(await rep.getStatus()).toEqual(statusBefore);
		expect(await dfp.read(rep.path("conflict.md"))).toEqual("content 1");
		expect(await rep.getCurrentHash()).toEqual(hashBefore);
		expect(await rep.getAllBranches()).toEqual(["conflict", "master"]);
	});

	it("Получает файлы для слияния", async () => {
		await rep.commit({ "conflict.md": "content 1", "2.md": "content 2" });
		await makeConflict(rep);

		const filesToMerge = await baseGitMergeConflictResolver.getFilesToMerge();

		expect(filesToMerge).toEqual([
			{ content: CONFLICT_CONTENT, path: "conflict.md", title: null, type: FileStatus.conflict },
		]);
	});

	it("Решает конфликт слияния", async () => {
		await rep.commit({ "conflict.md": "content 1", "2.md": "content 2" });
		await makeConflict(rep);
		const conflictFiles = [
			{ content: "conflict content ours and theirs :)", path: "conflict.md", type: FileStatus.conflict },
		];

		await expect(baseGitMergeConflictResolver.resolveConflictedFiles(conflictFiles)).resolves.toBeUndefined();
		expect(await dfp.read(rep.path("conflict.md"))).toBe("conflict content ours and theirs :)");
		const conflictFileStatus = (await rep.getStatus()).find((value) => value[0] === "conflict.md");
		expect(conflictFileStatus).toEqual(["conflict.md", 1, 2, 2]);
	});
});

const makeConflict = async (rep: TestGitRepository) => {
	await rep.createNewBranch("conflict");
	await rep.commit({ "conflict.md": "conflict content theirs" });
	await rep.checkout("master");
	await rep.commit({ "conflict.md": "conflict content ours" });

	try {
		await rep.mergeBranches("master", "conflict");
	} catch {}
};
