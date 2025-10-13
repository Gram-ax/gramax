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

const repNameWithoutSubmodules = "remoteRep_local_no_submodules_for_test";

let storage: GitStorage;
let git: GitCommands;
const subGits: GitCommands[] = [];

const mockUserData: GitSourceData = {
	sourceType: SourceType.git,
	userEmail: "test-email@email.com",
	userName: "test user",
	domain: "http://localhost:8174",
	token: "",
};

describe("GitStorage", () => {
	beforeEach(() => {
		gitCommandsFetchMock.mockClear();
	});

	describe("Репозиторий без сабмодулей", () => {
		beforeEach(async () => {
			await dfp.copy(new Path("remoteRep_local_no_submodules"), new Path(repNameWithoutSubmodules));
			git = new GitCommands(dfp, new Path(repNameWithoutSubmodules));
			storage = new GitStorage(new Path(repNameWithoutSubmodules), dfp);

			await git.reset({ mode: "hard", head: await git.getParentCommit(await git.getHeadCommit()) });
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
			await storage.pull(mockUserData);
			const hashBefore = (await git.getHeadCommit()).toString();
			await dfp.write(new Path([repNameWithoutSubmodules, "new_file.txt"]), "new file content");
			await git.add(), await git.commit("", mockUserData);

			await expect(storage.push(mockUserData)).resolves.not.toThrow();
			expect((await git.getHeadCommit()).toString()).not.toBe(hashBefore);
		});
	});
});
