import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import RepositoryStateFile from "@ext/git/core/RepositoryStateFile/RepositorySettingsFile";

const path = (path: string) => new Path(path);
const fp = new DiskFileProvider(__dirname);
let rsf: RepositoryStateFile;

describe("RepositorySettingsFile", () => {
	beforeEach(async () => {
		await fp.mkdir(path("test"));
		await fp.mkdir(path("test/.git"));
		rsf = new RepositoryStateFile(path("test"), fp);
	});

	afterEach(async () => {
		await fp.delete(path("test"));
		rsf = null;
	});

	it("записывает состояние", async () => {
		await rsf.saveState({ value: "default", data: "testData" } as any);

		expect(await fp.read(path("test/.git/gramax/state.json"))).toBe(`{"value":"default","data":"testData"}`);
	});

	describe("получает состояние если файл gramax/state.json", () => {
		test("существует", async () => {
			await fp.write(path("test/.git/gramax/state.json"), `{"value":"default","data":"testData"}`);

			const state = await rsf.getState();

			expect(state).toEqual({ data: "testData", value: "default" });
		});

		test("не существует", async () => {
			expect(await fp.exists(path("test/.git/gramax/state.json"))).toBeFalsy();

			const state = await rsf.getState();

			expect(await fp.exists(path("test/.git/gramax/state.json"))).toBeTruthy();
			expect(state).toEqual({ value: "default" });
		});
	});
});
