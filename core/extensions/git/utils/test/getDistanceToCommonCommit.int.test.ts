import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import TestGitRepository from "@ext/git/test/TestGitRepository";
import getDistanceToCommonCommit from "@ext/git/utils/getDistanceToCommonCommit";

describe("Находит общий коммит между ветками A и B", () => {
	const rep = new TestGitRepository(__dirname);
	const dfp = new DiskFileProvider(__dirname);
	const gr = new GitCommands({ corsProxy: null }, dfp, new Path(rep.repDir));

	beforeEach(async () => {
		await rep.init();
		await rep.createNewBranch("common");
		await rep.commit({ "1.md": "content" });
		await rep.createNewBranch("A");
		await rep.createNewBranch("B");
		await rep.checkout("common");
	});

	afterEach(() => {
		rep.clear();
	});

	test("Если коммитов в ветке A больше", async () => {
		await makeCommits(rep, 30, "A");
		await makeCommits(rep, 20, "B");

		expect(await getDistanceToCommonCommit("A", "B", gr)).toEqual({ a: 30, b: 20 });
	});
	test("Если коммитов в ветке B больше", async () => {
		await makeCommits(rep, 30, "B");
		await makeCommits(rep, 20, "A");

		expect(await getDistanceToCommonCommit("A", "B", gr)).toEqual({ a: 20, b: 30 });
	});
	test("Если они на одном коммите", async () => {
		await makeCommits(rep, 0, "B");
		await makeCommits(rep, 0, "A");

		expect(await getDistanceToCommonCommit("A", "B", gr)).toEqual({ a: 0, b: 0 });
	});
	test("Если коммитов больше 100", async () => {
		await makeCommits(rep, 101, "B");
		await makeCommits(rep, 101, "A");

		const res = await getDistanceToCommonCommit("A", "B", gr);
		expect(res).toEqual({ a: 0, b: 0 });
	});
});

const makeCommits = async (rep: TestGitRepository, count: number, branch: string) => {
	await rep.checkout(branch);
	for (let i = 0; i < count; i++) {
		await rep.commit({ "1.md": `${branch}: ${i}` });
	}
};
