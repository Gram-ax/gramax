/**
 * @jest-environment node
 */

import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import type GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type { RepositoryMergeConflictState } from "@ext/git/core/Repository/state/RepositoryState";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import DiskFileProvider from "../../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../../logic/FileProvider/Path/Path";
import GitVersionControl from "../../../GitVersionControl/GitVersionControl";
import GitMergeConflictResolver from "../GitMergeConflictResolver";

const pushGitStorageMock = jest.spyOn(GitStorage.prototype, "push").mockImplementation(() => {
	return Promise.resolve();
});

const mockGitSourceData: GitSourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
	domain: "https://github.com",
	token: "test",
};

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);
const commit = async (
	gvc: GitVersionControl,
	files: { [filePath: string]: string | null },
	message = "change files",
): Promise<void> => {
	if (!files) return gvc.commit(message, mockGitSourceData);
	await Promise.all(
		Object.entries(files).map(async ([path, content]) => {
			await dfp.write(repPath(path), content);
		}),
	);
	await gvc.add(Object.keys(files).map(path), true);
	return gvc.commit(message, mockGitSourceData);
};

const dfp = new DiskFileProvider(__dirname);

let resolver: GitMergeConflictResolver;
let gvc: GitVersionControl;

const CONFLICT_CONTENT = `<<<<<<< ours
conflict content ours
=======
conflict content theirs
>>>>>>> theirs
`;

describe("GitMergeConflictResolver", () => {
	beforeEach(async () => {
		pushGitStorageMock.mockClear();
		await dfp.mkdir(path("testRep"));
		await GitVersionControl.init(dfp, path("testRep"), mockGitSourceData);
		gvc = new GitVersionControl(path("testRep"), dfp);
		await commit(gvc, { "1.txt": "init" });
		await gvc.createNewBranch("conflict");
		const storage = new GitStorage(path("testRep"), dfp);
		const repo = new WorkdirRepository(path("testRep"), dfp, gvc, storage);
		resolver = new GitMergeConflictResolver(repo, dfp, path("testRep"));
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		await RepositoryProvider.resetRepo();
		resolver = null;
		gvc = null;
	});

	describe("Прерывает слияние", () => {
		test("в состоянии нет названии ветки до мержа", async () => {
			await commit(gvc, { "1.txt": "conflict content theirs" });
			await gvc.checkoutToBranch(mockGitSourceData, "master");
			await commit(gvc, { "1.txt": "conflict content ours" });
			const hashBefore = (await gvc.getCommitHash()).toString();
			const statusBefore = await gvc.getChanges();
			await gvc.mergeBranch(mockGitSourceData, { theirs: "conflict" });
			expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

			const state: RepositoryMergeConflictState = {
				value: "mergeConflict",
				data: { conflictFiles: null, deleteAfterMerge: null, reverseMerge: null, theirs: null, squash: false },
			};

			await resolver.abortMerge(state, mockGitSourceData);

			expect((await gvc.getCurrentBranch()).toString()).toEqual("master");
			expect(await gvc.getChanges()).toEqual(statusBefore);
			expect(await dfp.read(repPath("1.txt"))).toEqual("conflict content ours");
			expect((await gvc.getCommitHash()).toString()).toEqual(hashBefore);
			expect((await gvc.getAllBranches()).map((x) => x.toString())).toEqual(["conflict", "master"]);
		});

		test("в состоянии есть название ветки до мержа", async () => {
			await commit(gvc, { "1.txt": "conflict content theirs" });
			const hashBefore = (await gvc.getCommitHash()).toString();
			const statusBefore = await gvc.getChanges();
			await gvc.checkoutToBranch(mockGitSourceData, "master");
			await commit(gvc, { "1.txt": "conflict content ours" });
			await gvc.mergeBranch(mockGitSourceData, { theirs: "conflict" });
			expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

			const state: RepositoryMergeConflictState = {
				value: "mergeConflict",
				data: {
					conflictFiles: null,
					deleteAfterMerge: null,
					reverseMerge: null,
					theirs: null,
					branchNameBefore: "conflict",
					squash: false,
				},
			};

			await resolver.abortMerge(state, mockGitSourceData);

			expect((await gvc.getCurrentBranch()).toString()).toEqual("conflict");
			expect(await gvc.getChanges()).toEqual(statusBefore);
			expect(await dfp.read(repPath("1.txt"))).toEqual("conflict content theirs");
			expect((await gvc.getCommitHash()).toString()).toEqual(hashBefore);
			expect((await gvc.getAllBranches()).map((x) => x.toString())).toContain("conflict");
			expect((await gvc.getAllBranches()).map((x) => x.toString())).toContain("master");
		});
	});

	test("Решает конфликт слияния", async () => {
		await commit(gvc, { "1.txt": "conflict content theirs" });
		await gvc.checkoutToBranch(mockGitSourceData, "master");
		await commit(gvc, { "1.txt": "conflict content ours" });
		const hashBeforeCommit = (await gvc.getCommitHash()).toString();
		const resolvedMergeFiles = [{ path: "1.txt", content: "conflict content ours and theirs :)" }];

		await gvc.mergeBranch(mockGitSourceData, { theirs: "conflict" });
		expect(await dfp.read(repPath("1.txt"))).toEqual(CONFLICT_CONTENT);

		const state: RepositoryMergeConflictState = {
			value: "mergeConflict",
			data: {
				conflictFiles: null,
				deleteAfterMerge: null,
				reverseMerge: null,
				theirs: "conflict",
				squash: false,
			},
		};

		await expect(
			resolver.resolveConflictedFiles(resolvedMergeFiles, state, mockGitSourceData),
		).resolves.toBeUndefined();
		expect(await dfp.read(repPath("1.txt"))).toBe("conflict content ours and theirs :)");
		expect((await gvc.getCommitHash()).toString()).not.toEqual(hashBeforeCommit);
		expect((await gvc.getChanges()).length).toBe(0);
	});
});
