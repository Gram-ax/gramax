import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import GitVersionControl from "@ext/git/core/GitVersionControl/GitVersionControl";
import type Repository from "@ext/git/core/Repository/Repository";
import WorkdirRepository from "@ext/git/core/Repository/WorkdirRepository";

const path = (path: string) => new Path(path);
const fp = new DiskFileProvider(__dirname);
let rsf: Repository;

describe("RepositorySettingsFile", () => {
	beforeEach(async () => {
		await fp.mkdir(path("test/.git/gramax"));
		rsf = new WorkdirRepository(path("test"), fp, new GitVersionControl(path("test"), fp), null);
	});

	afterEach(async () => {
		await fp.delete(path("test"));
		rsf = null;
	});

	it("записывает состояние", async () => {
		const state = await rsf.getState();
		await state.saveState({ value: "default", data: "testData" } as any);

		expect(await fp.read(path("test/.git/gramax/state.json"))).toBe(`{"value":"default","data":"testData"}`);
	});

	describe("получает состояние если файл gramax/state.json", () => {
		test("существует", async () => {
			await fp.write(path("test/.git/gramax/state.json"), `{"value":"default","data":"testData"}`);

			const state = await rsf.getState();

			expect(state.inner).toEqual({ data: "testData", value: "default" });
		});

		test("не существует", async () => {
			expect(await fp.exists(path("test/.git/gramax/state.json"))).toBeFalsy();

			const state = await rsf.getState();

			expect(await fp.exists(path("test/.git/gramax/state.json"))).toBeTruthy();
			expect(state.inner).toEqual({ value: "default" });
		});
	});
});
