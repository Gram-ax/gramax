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
import FileRepository from "@ext/git/core/Repository/test/utils/FileRepository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";
import { TEST_GIT_FIXTURES_PATH } from "@ext/git/test/testGitFixturesPath";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import fs from "fs";

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
	beforeEach(async () => {
		await RepositoryProvider.resetRepo();
		gitCommandsFetchMock.mockClear();
	});

	describe("changes state to", () => {
		beforeEach(async () => {
			await RepositoryProvider.resetRepo();
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
			await RepositoryProvider.resetRepo();
			await dfp.delete(path("testRep"));
			rep = null;
		});
		test("conflict", async () => {
			await rep.gvc.createNewBranch("B");
			await dfp.write(repPath("1.txt"), "111\nBBB\n333");
			await rep.publish({ commitMessage: "test", data: mockUserData, filesToPublish: [path("1.txt")] });
			await rep.checkout({ data: mockUserData, branch: "master" });
			await dfp.write(repPath("1.txt"), "111\nmaster\n333");
			await rep.publish({ commitMessage: "test", data: mockUserData, filesToPublish: [path("1.txt")] });
			let attempts = 3;
			while (attempts > 0) {
				try {
					await rep.merge({ targetBranch: "B", deleteAfterMerge: false, data: mockUserData });
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
					expect(await dfp.read(repPath(".git/gramax/state.json"))).toBe(JSON.stringify(state));
					expect((await rep.getState()).inner).toEqual(state);
					break;
				} catch (err) {
					attempts--;
				}
			}
		});
		describe("default", () => {
			test("when aborting merge", async () => {
				const state = { value: "default" };
				const s = await rep.getState();
				await s.abortMerge(mockUserData);

				expect(await dfp.read(repPath(".git/gramax/state.json"))).toBe(JSON.stringify(state));
				expect((await rep.getState()).inner).toEqual(state);
			});
			test("when resolving merge", async () => {
				const state = { value: "default" };
				const s = await rep.getState();
				await s.resolveMerge([{ path: "1.txt", content: "resolved" }], mockUserData);

				expect(await dfp.read(repPath(".git/gramax/state.json"))).toBe(JSON.stringify(state));
				expect((await rep.getState()).inner).toEqual(state);
			});
		});
	});

	describe("synchronizes recursively", () => {
		const repNameWithSubmodules = "remoteRep_local_for_test";

		beforeEach(async () => {
			dfp = new DiskFileProvider(TEST_GIT_FIXTURES_PATH);
			await dfp.copy(new Path("remoteRep_local"), new Path(repNameWithSubmodules));

			gvc = new GitVersionControl(path(repNameWithSubmodules), dfp);
			const storage = new GitStorage(path(repNameWithSubmodules), dfp);
			rep = new WorkdirRepository(path(repNameWithSubmodules), dfp, gvc, storage);

			await gvc.reset({ mode: "hard", head: await gvc.getParentCommitHash(await gvc.getHeadCommit()) });
			await gvc.checkoutSubGitVersionControls();
			for (const subGvc of await gvc.getSubGitVersionControls()) {
				await subGvc.reset({ mode: "hard", head: await subGvc.getParentCommitHash(await subGvc.getHeadCommit()) });
			}
		});
		afterEach(async () => {
			await dfp.delete(new Path(repNameWithSubmodules));
		});

		test("changes exist in main repository and submodules", async () => {
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

		test("changes exist only in main repository", async () => {
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

	describe("checkout", () => {
		let fr: FileRepository;
		let rep: WorkdirRepository;
		let remoteRep: WorkdirRepository;

		beforeEach(async () => {
			gitCommandsFetchMock.mockRestore();
			pushGitStorageMock.mockRestore();
			fr = new FileRepository(__dirname);
			({ firstInstance: rep, secondInstance: remoteRep } = fr.create());

			fs.writeFileSync(fr.secondPath + "/remote_change", "remote change");
			await remoteRep.publish({
				commitMessage: "test",
				data: mockUserData,
				filesToPublish: [path("remote_change")],
			});
		});

		afterEach(() => {
			fr.clear();
			fr = null;
		});

		test("and pull", async () => {
			const commitHashBefore = await rep.gvc.getHeadCommit();

			await rep.gvc.createNewBranch("local");
			await rep.checkout({ data: mockUserData, branch: "master" });

			const commitHashAfter = await rep.gvc.getHeadCommit();
			const parentCommitHash = await rep.gvc.getParentCommitHash(commitHashAfter);

			expect(commitHashAfter.toString()).not.toBe(commitHashBefore.toString());
			expect(parentCommitHash.toString()).toBe(commitHashBefore.toString());
		});

		test("and don't pull if there are local changes", async () => {
			const commitHashBefore = await rep.gvc.getHeadCommit();

			await rep.gvc.createNewBranch("local");
			fs.writeFileSync(fr.firstPath + "/change", "change");

			const statusBefore = await rep.gvc.getChanges();
			expect(statusBefore.length).toBe(1);

			await rep.checkout({ data: mockUserData, branch: "master" });

			const commitHashAfter = await rep.gvc.getHeadCommit();
			const statusAfter = await rep.gvc.getChanges();

			expect(commitHashAfter.toString()).toBe(commitHashBefore.toString());
			expect(statusAfter.length).toBe(1);
			expect(fs.readFileSync(fr.firstPath + "/change", "utf-8")).toBe("change");
		});
	});
});
