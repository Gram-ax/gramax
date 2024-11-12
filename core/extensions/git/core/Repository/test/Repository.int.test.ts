/**
 * @jest-environment node
 */

import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitStorage from "@ext/git/core/GitStorage/GitStorage";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { GitStatus } from "@ext/git/core/GitWatcher/model/GitStatus";
import type Repository from "@ext/git/core/Repository/Repository";
import RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import { TEST_GIT_FIXTURES_PATH } from "@ext/git/test/testGitFixturesPath";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const pushGitStorageMock = jest.spyOn(GitStorage.prototype, "push").mockImplementation(() => {
	return Promise.resolve();
});

const gitCommandsFetchMock = jest.spyOn(GitCommands.prototype, "fetch").mockImplementation(() => {
	return Promise.resolve();
});

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);

let dfp = new DiskFileProvider(__dirname);

let gvc: GitVersionControl;
let rep: Repository;

describe("Repository", () => {
	beforeEach(() => {
		gitCommandsFetchMock.mockClear();
	});

	describe("меняет состояние на", () => {
		beforeEach(async () => {
			pushGitStorageMock.mockClear();
			await dfp.mkdir(path("testRep"));
			await GitVersionControl.init(dfp, path("testRep"), mockUserData);
			gvc = new GitVersionControl(path("testRep"), dfp);
			const storage = new GitStorage(path("testRep"), dfp);
			rep = new WorkdirRepository(path("testRep"), dfp, gvc, storage);
			await dfp.write(repPath("1.txt"), "111\n222\n333");
			await rep.publish({ commitMessage: "test", data: mockUserData, filesToPublish: [path("1.txt")] });
		});

		afterEach(async () => {
			await dfp.delete(path("testRep"));
			await RepositoryProvider.invalidateRepoCache([]);
			rep = null;
		});
		beforeEach(async () => {
			await rep.gvc.createNewBranch("B");
			await dfp.write(repPath("1.txt"), "111\nBBB\n333");
			await rep.publish({ commitMessage: "test", data: mockUserData, filesToPublish: [path("1.txt")] });
			await rep.checkout({ data: mockUserData, branch: "master" });
			await dfp.write(repPath("1.txt"), "111\nmaster\n333");
			await rep.publish({ commitMessage: "test", data: mockUserData, filesToPublish: [path("1.txt")] });
			await rep.merge({ targetBranch: "B", deleteAfterMerge: false, data: mockUserData });
		});
		test("конфликт", async () => {
			const state = {
				value: "mergeConflict",
				data: {
					branchNameBefore: "master",
					theirs: "master",
					conflictFiles: [{ status: "bothModified", path: "1.txt" }],
					deleteAfterMerge: false,
					reverseMerge: true,
				},
			};
			expect((await rep.getState()).inner).toEqual(state);
			expect(await dfp.read(repPath(".git/gramax/state.json"))).toBe(JSON.stringify(state));
		});
		describe("стандартное", () => {
			test("при аборте мержа", async () => {
				const state = { value: "default" };
				const s = await rep.getState();
				await s.abortMerge(mockUserData);

				expect((await rep.getState()).inner).toEqual(state);
				expect(await dfp.read(repPath(".git/gramax/state.json"))).toBe(JSON.stringify(state));
			});
			test("при решении мержа", async () => {
				const state = { value: "default" };
				const s = await rep.getState();
				await s.resolveMerge([{ path: "1.txt", content: "resolved" }], mockUserData);

				expect((await rep.getState()).inner).toEqual(state);
				expect(await dfp.read(repPath(".git/gramax/state.json"))).toBe(JSON.stringify(state));
			});
		});
	});

	describe("синхронизирует рекурсивно", () => {
		const repNameWithSubmodules = "remoteRep_local_for_test";

		beforeEach(async () => {
			dfp = new DiskFileProvider(TEST_GIT_FIXTURES_PATH);
			await dfp.copy(new Path("remoteRep_local"), new Path(repNameWithSubmodules));

			gvc = new GitVersionControl(path(repNameWithSubmodules), dfp);
			const storage = new GitStorage(path(repNameWithSubmodules), dfp);
			rep = new WorkdirRepository(path(repNameWithSubmodules), dfp, gvc, storage);

			await gvc.hardReset(await gvc.getParentCommitHash(await gvc.getHeadCommit()));
			await gvc.checkoutSubGitVersionControls();
			for (const subGvc of await gvc.getSubGitVersionControls()) {
				await subGvc.hardReset(await subGvc.getParentCommitHash(await subGvc.getHeadCommit()));
			}
		});
		afterEach(async () => {
			await dfp.delete(new Path(repNameWithSubmodules));
		});

		test("изменения есть в основном репозитории и в подумодулях", async () => {
			let subGvcs = await gvc.getSubGitVersionControls();

			const headCommitHash = (await gvc.getHeadCommit()).toString();
			const subModule1CommitHash = (await subGvcs[0].getHeadCommit()).toString();
			const subModule2CommitHash = (await subGvcs[1].getHeadCommit()).toString();
			let items: GitStatus[];

			rep.gvc.events.on("files-changed", (gitItems) => {
				items = gitItems.items;
			});

			await rep.sync({ data: mockUserData, recursivePull: true });

			subGvcs = await gvc.getSubGitVersionControls();
			expect((await gvc.getHeadCommit()).toString()).not.toBe(headCommitHash);
			expect((await subGvcs[0].getHeadCommit()).toString()).not.toBe(subModule1CommitHash);
			expect((await subGvcs[1].getHeadCommit()).toString()).not.toBe(subModule2CommitHash);
			expect(items.map((x) => x.path.value)).toEqual([
				"main.txt",
				"docs/submodule1/submodule1.txt",
				"docs/submodule2/submodule2.txt",
			]);
		});

		test("изменения есть только основном репозитории", async () => {
			await rep.sync({ data: mockUserData, recursivePull: false });

			let subGvcs = await gvc.getSubGitVersionControls();

			const headCommitHash = (await gvc.getHeadCommit()).toString();
			const subModule1CommitHash = (await subGvcs[0].getHeadCommit()).toString();
			const subModule2CommitHash = (await subGvcs[1].getHeadCommit()).toString();
			let items: GitStatus[];

			rep.gvc.events.on("files-changed", (gitItems) => {
				items = gitItems.items;
			});

			await rep.sync({ data: mockUserData, recursivePull: true });

			subGvcs = await gvc.getSubGitVersionControls();
			expect((await gvc.getHeadCommit()).toString()).toBe(headCommitHash);
			expect((await subGvcs[0].getHeadCommit()).toString()).not.toBe(subModule1CommitHash);
			expect((await subGvcs[1].getHeadCommit()).toString()).not.toBe(subModule2CommitHash);
			expect(items.map((x) => x.path.value)).toEqual([
				"docs/submodule1/submodule1.txt",
				"docs/submodule2/submodule2.txt",
			]);
		});
	});
});
