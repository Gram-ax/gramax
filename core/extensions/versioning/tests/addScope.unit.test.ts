import Path from "@core/FileProvider/Path/Path";
import { addScopeToPath, hasScopeSeparator } from "../addScopeToPath";

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

	// The address bar hands back the scope percent-encoded when the URL was opened in encoded form; the
	// old scope still has to be replaced instead of a second one being appended.
	test("заменяет закодированный скоп в пути", () => {
		const result = addScopeToPath("/test-docs%3Areleases%252Fv1.0/quick-start", "releases/v2.0");
		expect(result).toBe("/test-docs:releases%2Fv2.0/quick-start");
	});

	test("удаляет закодированный скоп, если новый скоп не предоставлен", () => {
		const result = addScopeToPath("/test-docs%3Areleases%252Fv1.0/quick-start");
		expect(result).toBe("/test-docs/quick-start");
	});

	test("удаляет скоп, если новый скоп не предоставлен", () => {
		const result = addScopeToPath("/root:old-scope/branch/file");
		expect(result).toBe("/root/branch/file");
	});

	describe("hasScopeSeparator", () => {
		test("ловит scope-разделитель в имени каталога", () => {
			expect(hasScopeSeparator("bimknow:commit-abc123")).toBe(true);
		});
		test("ловит scope-разделитель в полном пути", () => {
			expect(hasScopeSeparator("/root:feature/branch/file")).toBe(true);
		});
		test("отвергает имя без скопа", () => {
			expect(hasScopeSeparator("bimknow")).toBe(false);
		});
		test("отвергает пустую строку", () => {
			expect(hasScopeSeparator("")).toBe(false);
		});
		test("отвергает undefined", () => {
			expect(hasScopeSeparator(undefined as unknown as string)).toBe(false);
		});
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
