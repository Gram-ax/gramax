/**
 * @jest-environment node
 */
import fs from "fs-extra";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import TestGitRepository from "../../../test/TestGitRepository";
import { GitVersion } from "../../model/GitVersion";
import GitRepository from "../GitRepository";
import GitError from "../errors/GitError";

describe("GitRepository", () => {
	const rep = new TestGitRepository(__dirname);
	const dfp = new DiskFileProvider(__dirname);
	const gitRepository = new GitRepository({ corsProxy: null }, dfp, new Path(rep.repDir));

	beforeEach(async () => {
		await rep.init();
	});

	afterEach(() => {
		rep.clear();
	});

	describe("Находит контент файла по его пути", () => {
		test("В актуальном коммите", async () => {
			await rep.commit({ "1.md": "hello world" });

			const result = await gitRepository.showFileContent(new Path("1.md"));

			expect(result).toEqual("hello world");
		});
		test("В определённом коммите", async () => {
			const hash1 = await rep.commit({ "1.md": "hello world" });
			const hash2 = await rep.commit({ "1.md": "hello world 2" });

			const result1 = await gitRepository.showFileContent(new Path("1.md"), new GitVersion(hash1));
			const result2 = await gitRepository.showFileContent(new Path("1.md"), new GitVersion(hash2));

			expect([result1, result2]).toEqual(["hello world", "hello world 2"]);
		});
		test("В несуществующем коммите выбрасывает ошибку GitError", async () => {
			await rep.commit({ "1.md": "hello world" });

			await expect(async () => {
				await gitRepository.showFileContent(new Path("1.md"), new GitVersion("someNonexistentHash"));
			}).rejects.toThrowError(GitError);
		});
	});
	describe("Находит историю файла по его пути", () => {
		test("Если файл существует в гит", async () => {
			await rep.commit({ "1.md": "hello world" });
			await rep.commit({ "1.md": "hello world 2" });
			await rep.commit({ "2.md": "new file" });
			await rep.commit({ "1.md": "hello world 3" });

			const result = await gitRepository.getFileHistory(new Path("1.md"));

			expect(result.map((x) => x.content)).toEqual(["hello world 3", "hello world 2", "hello world"]);
		});
		test("Если файла не существует в гит выбрасывает ошибку GitError", async () => {
			await fs.writeFile(__dirname + "/testRep/new.md", "new file content");

			await expect(async () => {
				await gitRepository.getFileHistory(new Path("new.md"));
			}).rejects.toThrowError(GitError);
		});
	});
	describe("Находит коммит родителя по заданному коммиту", () => {
		test("Для обычного коммита", async () => {
			const hash1 = await rep.commit({ "1.md": "hello world" });
			const hash2 = await rep.commit({ "1.md": "hello world 2" });

			const result = await gitRepository.getParentCommit(new GitVersion(hash2));

			expect(result.toString()).toEqual(hash1);
		});
		test("Для merge коммита", async () => {
			await rep.commit({ "1.md": "hello world" }, "add file 1.md");
			await rep.createNewBranch("test");
			await rep.commit({ "1.md": "hello world 2" }, "change file 1.md");
			await rep.checkout("master");
			const lastHash = await rep.commit({ "2.md": "hello world 3" }, "add file 2.md");
			const merge = await rep.mergeBranches("master", "test");
			const result = await gitRepository.getParentCommit(new GitVersion(merge.oid));

			expect(result.toString()).toEqual(lastHash);
		});
	});
	describe("Выполняет Reset", () => {
		test("Soft", async () => {
			await rep.commit({ "1.md": "1", "2.md": "2", "3.md": "3" });

			await gitRepository.softReset();

			const res = JSON.stringify(await rep.getStatus()).includes('["1.md",0,2,2],["2.md",0,2,2],["3.md",0,2,2]');
			expect(res).toBe(true);
		});
		test("Hard", async () => {
			await rep.commit({ "1.md": "1", "2.md": "2", "3.md": "3" });
			const statusBefore = await rep.getStatus();

			await fs.writeFile(__dirname + "/testRep/1.md", "new 1");
			await fs.writeFile(__dirname + "/testRep/4.md", "new file");
			await fs.unlink(__dirname + "/testRep/2.md");

			await gitRepository.hardReset();

			expect(await rep.getStatus()).toEqual(statusBefore);
		});
	});
	describe("Выполяет Restore", () => {
		it("Отслеживаемых файлов", async () => {
			await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
			await rep.add({ "1.md": "new content 1" });

			await gitRepository.restore(true, [new Path("1.md")]);

			const res = JSON.stringify(await rep.getStatus()).includes('["1.md",1,2,1]');
			expect(res).toBe(true);
		});
		describe("Для неотслеживаемых файлов", () => {
			test("Новых", async () => {
				await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
				const previousState = await rep.getStatus();
				await fs.writeFile(__dirname + "/testRep/4.md", "content 4");

				await gitRepository.restore(false, [new Path("4.md")]);

				expect(previousState).toEqual(await rep.getStatus());
			});
			test("Изменённых", async () => {
				await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
				const previousState = await rep.getStatus();
				await fs.writeFile(__dirname + "/testRep/1.md", "new content");

				await gitRepository.restore(false, [new Path("1.md")]);

				expect(previousState).toEqual(await rep.getStatus());
			});
			test("Удалённых", async () => {
				await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
				const previousState = await rep.getStatus();
				await fs.unlink(__dirname + "/testRep/1.md");

				await gitRepository.restore(false, [new Path("1.md")]);

				expect(previousState).toEqual(await rep.getStatus());
			});
		});
	});
	it("Находит разницу между двумя коммитами", async () => {
		const firstCommit = await rep.commit({ "1.md": "content 1", "2.md": "content 2" });
		await fs.unlink(__dirname + "/testRep/2.md");
		await rep.add({ "1.md": "new content 1", "2.md": null, "3.md": "content 3" });
		const secondCommit = await rep.commit();

		const diff = await gitRepository.diff(new GitVersion(firstCommit), new GitVersion(secondCommit));

		expect(diff.map((x) => ({ path: x.path.value, type: x.type }))).toEqual([
			{ path: "1.md", type: "modified" },
			{ path: "2.md", type: "delete" },
			{ path: "3.md", type: "new" },
		]);
	});
	describe("Стеш", () => {
		test("Создаёт", async () => {
			await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
			const statusBefore = await rep.getStatus();

			await fs.writeFile(__dirname + "/testRep/1.md", "new content 1");
			await fs.unlink(__dirname + "/testRep/2.md");
			await fs.writeFile(__dirname + "/testRep/4.md", "new file");

			const stashHash = await gitRepository.stash(rep.source);
			const statusAfter = await rep.getStatus();

			expect(await rep.getCurrentBranch()).toBe("master");
			expect(await rep.getAllBranches()).toEqual(["master", stashHash.toString()]);
			expect(statusBefore).toEqual(statusAfter);
		});
		test("Применяет", async () => {
			await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });

			await fs.writeFile(__dirname + "/testRep/1.md", "new content 1");
			await fs.unlink(__dirname + "/testRep/2.md");
			await fs.writeFile(__dirname + "/testRep/4.md", "new file");
			const statusBefore = await rep.getStatus();

			const stashHash = await gitRepository.stash(rep.source);
			await gitRepository.applyStash(rep.source, stashHash);

			const statusAfter = await rep.getStatus();

			expect(await rep.getCurrentBranch()).toBe("master");
			expect(await rep.getAllBranches()).toEqual(["master"]);
			expect(statusBefore).toEqual(statusAfter);
		});
	});
	it("Создаёт мердж коммит", async () => {
		await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
		await rep.createNewBranch("develop");
		await rep.commit({ "1.md": "new content 1" });
		await rep.checkout("master");
		const masterRef = await rep.resolveRef("master");
		const developRef = await rep.resolveRef("develop");
		await rep.add({ "2.md": "new content 2" });

		const hash = await gitRepository.commit("create merge commit", rep.source, ["master", "develop"]);

		const parents = (await rep.readCommit(hash.toString())).commit.parent;
		expect(parents.length).toBe(2);
		expect(parents).toEqual([masterRef, developRef]);
	});
});
