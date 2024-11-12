import Path from "@core/FileProvider/Path/Path";
import { addGitTreeScopeToPath } from "../utils";

describe("addGitTreeScopeToPath", () => {
	it("обрабатывает путь без скопа", () => {
		const result = addGitTreeScopeToPath("/root/branch/file");
		expect(result).toBe("/root/branch/file");
	});

	it("добавляет скоп к пути", () => {
		const result = addGitTreeScopeToPath("/root/branch/file", "feature/new");
		expect(result).toBe("/root:feature%2Fnew/branch/file");
	});

	describe("добавляет скоп к массиву пути", () => {
		it("без скопа", () => {
			const result = addGitTreeScopeToPath(["", "root", "branch", "file"]);
			expect(result).toBe("/root/branch/file");
		});
		it("со скопом", () => {
			const result = addGitTreeScopeToPath(["", "root", "branch", "file"], "feature/new");
			expect(result).toBe("/root:feature%2Fnew/branch/file");
		});
	});

	describe("обрабатывает объект Path", () => {
		it("без скопа", () => {
			const pathObj = new Path("/root/branch/file");
			const result = addGitTreeScopeToPath(pathObj);
			expect(result).toBe("/root/branch/file");
		});
		it("со скопом", () => {
			const pathObj = new Path("/root/branch/file");
			const result = addGitTreeScopeToPath(pathObj, "feature/new");
			expect(result).toBe("/root:feature%2Fnew/branch/file");
		});
	});

	it("обрабатывает путь с существующим скопом", () => {
		const result = addGitTreeScopeToPath("/root:old-scope/branch/file", "feature/new");
		expect(result).toBe("/root:feature%2Fnew/branch/file");
	});

	it("удаляет скоп, если новый скоп не предоставлен", () => {
		const result = addGitTreeScopeToPath("/root:old-scope/branch/file");
		expect(result).toBe("/root/branch/file");
	});

	describe("обрабатывает скоп, не начинающийся с /", () => {
		it("просто путь", () => {
			const result = addGitTreeScopeToPath("root/branch/file", "feature/new");
			expect(result).toBe("root:feature%2Fnew/branch/file");
		});
		it("массив путей", () => {
			const result = addGitTreeScopeToPath(["root", "branch", "file"], "feature/new");
			expect(result).toBe("root:feature%2Fnew/branch/file");
		});
		it("объект Path", () => {
			const pathObj = new Path("root/branch/file");
			const result = addGitTreeScopeToPath(pathObj, "feature/new");
			expect(result).toBe("root:feature%2Fnew/branch/file");
		});
	});
});
