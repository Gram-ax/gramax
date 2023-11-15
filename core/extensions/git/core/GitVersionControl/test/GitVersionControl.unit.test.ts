/**
 * @jest-environment node
 */
import { setTimeout } from "timers/promises";
import DiskFileProvider from "../../../../../logic/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { FileStatus } from "../../../../Watchers/model/FileStatus";
import TestGitRepository from "../../../test/TestGitRepository";
import GitVersionControl from "../GitVersionControl";

const dfp = new DiskFileProvider(__dirname);
const rep = new TestGitRepository(__dirname);

let gvc: GitVersionControl;

describe("GitVersionControl", () => {
	beforeEach(async () => {
		await rep.init();
		gvc = new GitVersionControl({ corsProxy: null }, new Path(rep.repDir), dfp);
	});
	afterEach(async () => {
		await setTimeout(100);
		rep.clear();
		(gvc as any) = null;
	});

	describe("Branches", () => {
		it("Показывает текущую ветку", async () => {
			const branch = await gvc.getCurrentBranch();

			expect(branch.toString()).toEqual("master");
		});
		it("Создаёт новую ветку", async () => {
			await gvc.createNewBranch("develop");

			const branch = await gvc.getCurrentBranch();
			expect(branch.toString()).toEqual("develop");
		});
		it("Переключается на ветку", async () => {
			await gvc.createNewBranch("develop");
			await gvc.checkoutToBranch("master");

			const branch = await gvc.getCurrentBranch();
			expect(branch.toString()).toEqual("master");
		});
	});
	describe("Показывает изменения файлов", () => {
		it("В обычном репозитории", async () => {
			await rep.commit({ "1.md": "main" });
			await rep.commit({ "2.md": "hello world2" });
			await dfp.delete(rep.path("1.md"));
			await dfp.write(rep.path("new.md"), "add new file");
			await dfp.write(rep.path("2.md"), "change file content");

			const changes = await gvc.getChanges();

			expect(changes).toEqual([
				{ path: new Path("1.md"), type: FileStatus.delete, isUntracked: true },
				{ path: new Path("2.md"), type: FileStatus.modified, isUntracked: true },
				{ path: new Path("new.md"), type: FileStatus.new, isUntracked: true },
			]);
		});
		it("В репозитории с подмодулями", async () => {
			await rep.commit({ "1.md": "main" });
			await rep.submodule.commit({ "1_1.md": "submodule" });
			await dfp.write(rep.path("1.md"), "change file content");
			await dfp.write(rep.submodule.path("1_1.md"), "submodule change file content");

			const changes = await gvc.getChanges();

			expect(changes).toEqual([
				{ path: new Path("1.md"), type: FileStatus.modified, isUntracked: true },
				{ path: new Path("subModule/1_1.md"), type: FileStatus.modified, isUntracked: true },
			]);
		});
	});
	describe("Discard", () => {
		describe("Отменяет изменения по конкретным файлам по их пути", () => {
			it("В обычном репозитории", async () => {
				await rep.commit({ "1.md": "main" });
				await rep.commit({ "2.md": "hello world2" });
				await dfp.delete(rep.path("1.md"));
				await dfp.delete(rep.path("2.md"));

				await gvc.discard([new Path("1.md")]);

				const changes = await gvc.getChanges();

				expect(changes.length).toEqual(1);
			});
			it("В репозитории с подмодулями", async () => {
				const submodule = rep.submodule;
				await rep.commit({ "1.md": "main" });
				await rep.commit({ "2.md": "hello world2" });
				await dfp.delete(rep.path("1.md"));
				await dfp.delete(rep.path("2.md"));
				await submodule.commit({ "1_1.md": "submodule" });
				await submodule.commit({ "2_1.md": "submodule 2" });
				await dfp.delete(submodule.path("1_1.md"));
				await dfp.delete(submodule.path("2_1.md"));

				await gvc.discard([new Path("1.md")]);
				await gvc.discard([new Path("subModule/1_1.md")]);

				const changes = await gvc.getChanges();

				expect(changes.length).toEqual(2);
			});
		});
	});
	it("Показывает контент файла в последнем коммите по его пути", async () => {
		await rep.commit({ "1.md": "old" });
		await dfp.write(rep.path("1.md"), "new");

		const commitContent = await gvc.showLastCommitContent(new Path("1.md"));

		expect(commitContent).toEqual("old");
	});
	describe("Отслеживает файлы (git add)", () => {
		test("Измененные", async () => {
			await rep.commit({ "1.md": "content 1" });
			await dfp.write(rep.path("1.md"), "content2");

			await gvc.add([new Path("1.md")]);

			const result = JSON.stringify(await rep.getStatus()).includes('["1.md",1,2,2]');
			expect(result).toBe(true);
		});
		test("Новые", async () => {
			await dfp.write(rep.path("1.md"), "1");

			await gvc.add([new Path("1.md")]);

			const result = JSON.stringify(await rep.getStatus()).includes('["1.md",0,2,2]');
			expect(result).toBe(true);
		});

		test("Удаленные", async () => {
			await rep.commit({ "1.md": "content 1" });
			await dfp.delete(rep.path("1.md"));

			await gvc.add([new Path("1.md")]);

			const result = JSON.stringify(await rep.getStatus()).includes('["1.md",1,0,0]');
			expect(result).toBe(true);
		});
	});
	it("Коммитит файлы", async () => {
		await dfp.write(rep.path("1.md"), "1");
		await gvc.add([new Path("1.md")]);
		await gvc.commit("add 1.md", rep.source);

		const result = JSON.stringify(await rep.getStatus()).includes('["1.md",1,1,1]');
		expect(result).toBe(true);
	});
	it("Возвращает состояния репозитория до коммита", async () => {
		await rep.commit({ "1.md": "content 1", "2.md": "content 2", "3.md": "content 3" });
		await dfp.delete(rep.path("1.md"));
		await dfp.write(rep.path("2.md"), "new content 2");
		await dfp.write(rep.path("4.md"), "new content 4");
		await dfp.write(rep.path("5.md"), "new content 5");
		const previousState = await rep.getStatus();

		await rep.add({ "1.md": null, "2.md": null, "4.md": null });
		await rep.commit();

		await gvc.restoreRepositoryState();

		expect(previousState).toEqual(await rep.getStatus());
	});
});
