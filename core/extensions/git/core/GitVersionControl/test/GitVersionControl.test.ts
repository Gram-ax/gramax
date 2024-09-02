/**
 * @jest-environment node
 */

import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import { TEST_GIT_FIXTURES_PATH } from "@ext/git/test/testGitFixturesPath";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";

const dfp = new DiskFileProvider(TEST_GIT_FIXTURES_PATH);

const repNameWithSubmodules = "remoteRep_local_for_test";

let gvc: GitVersionControl;

describe("GitVersionControl", () => {
	beforeEach(async () => {
		await dfp.copy(new Path("remoteRep_local"), new Path(repNameWithSubmodules));
		gvc = new GitVersionControl(new Path(repNameWithSubmodules), dfp);
	});
	afterEach(async () => {
		await dfp.delete(new Path(repNameWithSubmodules));
	});

	test("делает чекаут подмодулей", async () => {
		const subGvcs = await gvc.getSubGitVersionControls();
		expect(subGvcs.length).toBe(2);

		await expect(subGvcs[0].getCurrentBranch()).rejects.toThrow(DefaultError);
		await expect(subGvcs[1].getCurrentBranch()).rejects.toThrow(DefaultError);

		await gvc.checkoutSubGitVersionControls();

		expect((await subGvcs[0].getCurrentBranch()).toString()).toBe("master");
		expect((await subGvcs[1].getCurrentBranch()).toString()).toBe("master");
	});
});
