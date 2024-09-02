/**
 * @jest-environment node
 */

import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import GitCommands from "@ext/git/core/GitCommands/GitCommands";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import SourceData from "@ext/storage/logic/SourceDataProvider/model/SourceData";
import SourceType from "@ext/storage/logic/SourceDataProvider/model/SourceType";

const path = (path: string) => new Path(path);
const repPath = (path: string) => new Path(["testRep", path]);

async function writeFile(path: string, content: string): Promise<Path> {
	await dfp.write(repPath(path), content);
	return new Path(path);
}

const mockUserData: SourceData = {
	sourceType: SourceType.gitHub,
	userEmail: "test-email@email.com",
	userName: "test user",
};

const dfp = new DiskFileProvider(__dirname);
let git: GitCommands;

describe("GitCommands", () => {
	beforeEach(async () => {
		await dfp.mkdir(path("testRep"));
		await GitVersionControl.init(dfp, path("testRep"), mockUserData);
		git = new GitCommands(dfp, path("testRep"));
		const testFile = await writeFile("testFile", "testFile content");
		await git.add([testFile]), await git.commit("init", mockUserData);
	});

	afterEach(async () => {
		await dfp.delete(path("testRep"));
		git = null;
	});

	describe("делает reset", () => {
		describe("hard", () => {
			test("с изменениями", async () => {
				const testFile = await writeFile("testFile", "testFile new content");
				await git.add([testFile]);
				const hashBefore = (await git.commit("init", mockUserData)).toString();
				const statusBefore = await git.status();

				await dfp.write(repPath("testFile"), "some local change");
				await git.hardReset();

				expect(await dfp.read(repPath("testFile"))).toBe("testFile new content");
				expect((await git.getHeadCommit()).toString()).toBe(hashBefore);
				expect(await git.status()).toEqual(statusBefore);
			});
			test("без изменений", async () => {
				const testFile = await writeFile("testFile", "testFile new content");
				await git.add([testFile]);
				const hashBefore = (await git.commit("init", mockUserData)).toString();
				const statusBefore = await git.status();

				await git.hardReset();

				expect(await dfp.read(repPath("testFile"))).toBe("testFile new content");
				expect((await git.getHeadCommit()).toString()).toBe(hashBefore);
				expect(await git.status()).toEqual(statusBefore);
			});
		});
		describe("soft", () => {
			test("с изменениями", async () => {
				const testFile = await writeFile("testFile", "testFile new content");
				await git.add([testFile]);
				const hashBefore = (await git.commit("init", mockUserData)).toString();
				await dfp.write(repPath("testFile"), "some local change");
				const statusBefore = await git.status();

				await git.softReset();

				expect(await dfp.read(repPath("testFile"))).toBe("some local change");
				expect((await git.getHeadCommit()).toString()).toBe(hashBefore);
				expect(await git.status()).toEqual(statusBefore);
			});
			test("без изменений", async () => {
				const testFile = await writeFile("testFile", "testFile new content");
				await git.add([testFile]);
				const hashBefore = (await git.commit("init", mockUserData)).toString();
				const statusBefore = await git.status();

				await git.softReset();

				expect(await dfp.read(repPath("testFile"))).toBe("testFile new content");
				expect((await git.getHeadCommit()).toString()).toBe(hashBefore);
				expect(await git.status()).toEqual(statusBefore);
			});
		});
	});

	it("получает статус", async () => {
		const wouldBeModified = await writeFile("wouldBeModified", "wouldBeModified content");
		const wouldBeDeleted = await writeFile("wouldBeDeleted", "wouldBeDeleted content");
		const unchangedFile = await writeFile("unchangedFile", "unchangedFile content");
		await git.add([wouldBeDeleted, unchangedFile, wouldBeModified]), await git.commit("", mockUserData);
		expect((await git.status()).length).toBe(0);

		await writeFile("wouldBeModified", "new wouldBeModified content");
		await writeFile("newFile", "newfile content");
		await dfp.delete(repPath("wouldBeDeleted"));

		expect(await git.status()).toEqual([
			{ isUntracked: true, path: path("newFile"), status: FileStatus.new },
			{ isUntracked: true, path: path("wouldBeDeleted"), status: FileStatus.delete },
			{ isUntracked: true, path: path("wouldBeModified"), status: FileStatus.modified },
		]);
	});

	describe("ветки", () => {
		it("Показывает текущую", async () => {
			const branch = await git.getCurrentBranch();

			expect(branch.toString()).toEqual("master");
		});
		it("Создаёт новую", async () => {
			await git.createNewBranch("develop");

			const branch = await git.getCurrentBranch();
			expect(branch.toString()).toEqual("develop");
		});
		it("Переключается на другую", async () => {
			await git.createNewBranch("develop");
			let branch = await git.getCurrentBranch();
			expect(branch.toString()).toEqual("develop");

			await git.checkout("master");
			branch = await git.getCurrentBranch();
			expect(branch.toString()).toEqual("master");
		});
	});
	it("Отменяет изменения", async () => {
		const wouldBeDeleted = await writeFile("wouldBeDeleted", "wouldBeDeleted content");
		const discardDelete = await writeFile("discardDelete", "discardDelete content");
		const wouldBeModified = await writeFile("wouldBeModified", "wouldBeModified content");
		const discardModify = await writeFile("discardModify", "discardModify content");

		await git.add([discardDelete, wouldBeDeleted, wouldBeModified, discardModify]);
		await git.commit("", mockUserData);

		await dfp.delete(repPath("wouldBeDeleted"));
		await dfp.delete(repPath("discardDelete"));
		await writeFile("wouldBeModified", "new wouldBeModified content");
		await writeFile("discardModify", "new discardModify content");
		await writeFile("wouldBeAdded", "wouldBeAdded content");
		const discardAdd = await writeFile("discardAdd", "discardAdd content");

		await git.restore(false, [discardDelete, discardModify, discardAdd]);

		const status = await git.status();

		expect(status.length).toBe(3);
		expect(status).toContainEqual({ isUntracked: true, path: path("wouldBeAdded"), status: FileStatus.new });
		expect(status).toContainEqual({ isUntracked: true, path: path("wouldBeDeleted"), status: FileStatus.delete });
		expect(status).toContainEqual({
			isUntracked: true,
			path: path("wouldBeModified"),
			status: FileStatus.modified,
		});
	});
	describe("Показывает контент файла по его пути", () => {
		test("в последнем коммите", async () => {
			const file1 = await writeFile("1", "old");
			await git.add([file1]), await git.commit("", mockUserData);
			await dfp.write(repPath("1"), "new");

			const commitContent = await git.showFileContent(path("1"));

			expect(commitContent).toEqual("old");
		});
		test("В определённом коммите", async () => {
			const file1 = await writeFile("1", "1");
			await git.add([file1]);
			const commitHash1 = await git.commit("", mockUserData);
			const file2 = await writeFile("1", "2");
			await git.add([file2]);
			const commitHash2 = await git.commit("", mockUserData);

			expect(await git.showFileContent(path("1"), commitHash1)).toBe("1");
			expect(await git.showFileContent(path("1"), commitHash2)).toBe("2");
		});
		test("Если файла не существует в гит, то пустой массив", async () => {
			const fileA = await writeFile("a", "a");

			expect(await git.getFileHistory(fileA)).toEqual([]);
		});
	});
});
