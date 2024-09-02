/**
 * @jest-environment node
 */

import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitSourceData from "@ext/git/core/model/GitSourceData.schema";
import { TEST_GIT_FIXTURES_PATH } from "@ext/git/test/testGitFixturesPath";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import GitStorage from "../GitStorage";

const gitCommandsFetchMock = jest.spyOn(GitCommands.prototype, "fetch").mockImplementation(() => {
	return Promise.resolve();
});

const dfp = new DiskFileProvider(TEST_GIT_FIXTURES_PATH);

const repNameWithSubmodules = "remoteRep_local_for_test";
const repNameWithoutSubmodules = "remoteRep_local_no_submodules_for_test";

const submodule1Path = repNameWithSubmodules + "/docs/submodule1";
const submodule2Path = repNameWithSubmodules + "/docs/submodule2";

let storage: GitStorage;
let git: GitCommands;
const subGits: GitCommands[] = [];

const mockUserData: GitSourceData = {
	sourceType: SourceType.git,
	userEmail: "test-email@email.com",
	userName: "test user",
	domain: "http://localhost:8173",
	token: "",
};

describe("GitStorage", () => {
	beforeEach(() => {
		gitCommandsFetchMock.mockClear();
	});
	describe("Репозиторий с сабмодулями", () => {
		beforeEach(async () => {
			await dfp.copy(new Path("remoteRep_local"), new Path(repNameWithSubmodules));
			git = new GitCommands(dfp, new Path(repNameWithSubmodules));
			subGits.push(new GitCommands(dfp, new Path(submodule1Path)));
			subGits.push(new GitCommands(dfp, new Path(submodule2Path)));
			storage = new GitStorage(new Path(repNameWithSubmodules), dfp);

			await subGits[0].checkout("master");
			await subGits[0].hardReset(await subGits[0].getParentCommit(await subGits[0].getHeadCommit()));

			await subGits[1].checkout("master");
			await subGits[1].hardReset(await subGits[1].getParentCommit(await subGits[1].getHeadCommit()));

			await git.hardReset(await git.getParentCommit(await git.getHeadCommit()));
		});
		afterEach(async () => {
			await dfp.delete(new Path(repNameWithSubmodules));
		});

		test("рекурсивный pull", async () => {
			const hashBefore = (await git.getHeadCommit()).toString();
			const submodule1HashBefore = (await subGits[0].getHeadCommit()).toString();
			const submodule2HashBefore = (await subGits[1].getHeadCommit()).toString();

			await storage.pull(mockUserData);

			expect((await git.getHeadCommit()).toString()).not.toBe(hashBefore);
			expect((await subGits[0].getHeadCommit()).toString()).not.toBe(submodule1HashBefore);
			expect((await subGits[1].getHeadCommit()).toString()).not.toBe(submodule2HashBefore);
		});
	});

	describe("Репозиторий без сабмодулей", () => {
		beforeEach(async () => {
			await dfp.copy(new Path("remoteRep_local_no_submodules"), new Path(repNameWithoutSubmodules));
			git = new GitCommands(dfp, new Path(repNameWithoutSubmodules));
			storage = new GitStorage(new Path(repNameWithoutSubmodules), dfp);

			await git.hardReset(await git.getParentCommit(await git.getHeadCommit()));
		});
		afterEach(async () => {
			await dfp.delete(new Path(repNameWithoutSubmodules));
		});

		describe("pull", () => {
			test("без конфилктов", async () => {
				const hashBefore = (await git.getHeadCommit()).toString();

				await storage.pull(mockUserData);

				expect((await git.getHeadCommit()).toString()).not.toBe(hashBefore);
			});

			test("с конфилктом", async () => {
				const hashBefore = (await git.getHeadCommit()).toString();
				await dfp.write(new Path([repNameWithoutSubmodules, "main.txt"]), "new change");
				await git.add(), await git.commit("", mockUserData);

				await storage.pull(mockUserData);

				const newContent = await dfp.read(new Path([repNameWithoutSubmodules, "main.txt"]));
				expect((await git.getHeadCommit()).toString()).not.toBe(hashBefore);
				expect(newContent).toContain("<<<<<<<");
				expect(newContent).toContain("=======");
				expect(newContent).toContain(">>>>>>>");
			});
		});
		test("push", async () => {
			const hashBefore = (await git.getHeadCommit()).toString();
			await dfp.write(new Path([repNameWithoutSubmodules, "new_file.txt"]), "new file content");
			await git.add(), await git.commit("", mockUserData);

			await expect(storage.push(mockUserData)).resolves.not.toThrow();
			expect((await git.getHeadCommit()).toString()).not.toBe(hashBefore);
		});
	});
});
