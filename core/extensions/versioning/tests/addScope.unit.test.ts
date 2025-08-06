import Path from "@core/FileProvider/Path/Path";
import { addScopeToPath } from "../utils";

describe("addGitTreeScopeToPath", () => {
	test("обрабатывает путь без скопа", () => {
		const result = addScopeToPath("/root/branch/file");
		expect(result).toBe("/root/branch/file");
	});

	test("добавляет скоп к пути", () => {
		const result = addScopeToPath("/root/branch/file", "feature/new");
		expect(result).toBe("/root:feature%2Fnew/branch/file");
	});

	describe("добавляет скоп к массиву пути", () => {
		test("без скопа", () => {
			const result = addScopeToPath(["", "root", "branch", "file"]);
			expect(result).toBe("/root/branch/file");
		});
		test("со скопом", () => {
			const result = addScopeToPath(["", "root", "branch", "file"], "feature/new");
			expect(result).toBe("/root:feature%2Fnew/branch/file");
		});
	});

	describe("обрабатывает объект Path", () => {
		test("без скопа", () => {
			const pathObj = new Path("/root/branch/file");
			const result = addScopeToPath(pathObj);
			expect(result).toBe("/root/branch/file");
		});
		test("со скопом", () => {
			const pathObj = new Path("/root/branch/file");
			const result = addScopeToPath(pathObj, "feature/new");
			expect(result).toBe("/root:feature%2Fnew/branch/file");
		});
	});

	test("обрабатывает путь с существующим скопом", () => {
		const result = addScopeToPath("/root:old-scope/branch/file", "feature/new");
		expect(result).toBe("/root:feature%2Fnew/branch/file");
	});

	test("удаляет скоп, если новый скоп не предоставлен", () => {
		const result = addScopeToPath("/root:old-scope/branch/file");
		expect(result).toBe("/root/branch/file");
	});

	describe("обрабатывает скоп, не начинающийся с /", () => {
		test("просто путь", () => {
			const result = addScopeToPath("root/branch/file", "feature/new");
			expect(result).toBe("root:feature%2Fnew/branch/file");
		});
		test("массив путей", () => {
			const result = addScopeToPath(["root", "branch", "file"], "feature/new");
			expect(result).toBe("root:feature%2Fnew/branch/file");
		});
		test("объект Path", () => {
			const pathObj = new Path("root/branch/file");
			const result = addScopeToPath(pathObj, "feature/new");
			expect(result).toBe("root:feature%2Fnew/branch/file");
		});
	});
});
