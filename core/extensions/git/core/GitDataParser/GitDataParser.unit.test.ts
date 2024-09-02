import gitDataParser from "./GitDataParser";

describe("GitDataParser", () => {
	describe("получает массив файлов и их изменений, распарсив логи команды", () => {
		test("git diff --name-status <old> <new>", () => {
			const gitDiff = `M\tdocs/cut.md
A\tdocs/.doc-root.yml
R072\tdocs/log/.category.yml\tdocs/.category.yml
D\tdocs/video.ts`;

			const changeItems = gitDataParser.getDiffChanges(gitDiff, false).map((c) => {
				return { absolutePath: c.path.value, type: c.status };
			});

			expect(changeItems).toEqual([
				{ absolutePath: "docs/cut.md", type: "modified" },
				{ absolutePath: "docs/.doc-root.yml", type: "new" },
				{ absolutePath: "docs/.category.yml", type: "new" },
				{ absolutePath: "docs/log/.category.yml", type: "delete" },
				{ absolutePath: "docs/video.ts", type: "delete" },
			]);
		});
	});
});
