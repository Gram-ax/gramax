/**
 * @jest-environment node
 */
import fs from "fs-extra";
import { setTimeout } from "timers/promises";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import TestGitRepository, { RemoteNames } from "../../../test/TestGitRepository";
import GitStorage from "../GitStorage";

const rep = new TestGitRepository(__dirname, "rep");
const dfp = new DiskFileProvider(__dirname);

let storage: GitStorage;

describe("GitStorage", () => {
	beforeAll(async () => {
		await rep.init(true);
		storage = new GitStorage(new Path(rep.repDir), dfp);
	});
	afterAll(async () => {
		await fs.rm(__dirname + "/testClone", { recursive: true, force: true, maxRetries: 5 });
	});

	beforeEach(async () => {
		await rep.init(true);
	});
	afterEach(async () => {
		await setTimeout(100);
		rep.clear();
	});

	// it("Рекурсивно клонирует репозиторий с подмодулем", async () => {
	// 	await GitStorage.clone({
	// 		repositoryPath: new Path("testClone"),
	// 		fp: dfp,
	// 		source: rep.source,
	// 		url: `http://localhost:8174/${RemoteNames.Push}`,
	// 	});

	// 	expect(await fs.exists(__dirname + "/testClone/.git")).toBeTruthy();
	// 	expect(await fs.exists(__dirname + "/testClone/subModule")).toBeTruthy();
	// 	expect((await fs.readdir(__dirname + "/testClone/subModule")).length).not.toBe(0);
	// });
	describe("Pull", () => {
		describe("Без конфликта", () => {
			test("Обычный репозиторий", async () => {
				await rep.setRemote(RemoteNames.Pull);
				expect(await fs.exists(__dirname + "/rep/file_to_pull.md")).toBeFalsy();

				await storage.pull(rep.source);

				expect(await fs.exists(__dirname + "/rep/file_to_pull.md")).toBeTruthy();
			});
			// it("Репозиторий с подмодулем", async () => {
			// 	await rep.submodule.setRemote(RemoteNames.SubModulePull);
			// 	expect(await fs.exists(__dirname + "/rep/subModule/file_to_pull_submodule.md")).toBeFalsy();

			// 	await storage.pull(rep.source);

			// 	expect(await fs.exists(__dirname + "/rep/subModule/file_to_pull_submodule.md")).toBeTruthy();
			// });
		});

		// TODO: пофиксить; тест падает, потому что либгит2(и гит) не считает такое конфликтом, поскольку тег добавлен вручную
		// describe("С конфликтом", () => {
		// 	describe("Обычный репозиторий", () => {
		// 		test("С нескольколькими изменениями", async () => {
		// 			await rep.setRemote(RemoteNames.Pull);
		// 			await fs.writeFile(__dirname + "/rep/1.md", "conflict\n");
		// 			await fs.writeFile(__dirname + "/rep/2.md", "2\n");
		// 			await fs.writeFile(__dirname + "/rep/3.md", "3\n");
		// 			const conflict = `<<<<<<< master\ncontent 0001\n=======\nconflict\n>>>>>>> stash_from`;

		// 			await expect(async () => {
		// 				await storage.pull(rep.source);
		// 			}).rejects.toThrowError(GitError);

		// 			const statusNow = await rep.getStatus();
		// 			expect((await fs.readFile(__dirname + "/rep/1.md", "utf-8")).includes(conflict)).toBeTruthy();
		// 			expect(await fs.exists(__dirname + "/rep/file_to_pull.md")).toBeTruthy();
		// 			expect(JSON.stringify(statusNow).includes('["2.md",1,2,1],["3.md",0,2,0]')).toBeTruthy();
		// 		});
		// 	});
		// });
	});
	describe("Push", () => {
		it("Пушит обычный репозиторий", async () => {
			await rep.setRemote(RemoteNames.Push);
			await rep.commit({ "commit.md": "commit.md" });

			await expect(storage.push(rep.source)).resolves.toBeUndefined();
		});
	});
});
