import Path from "../FileProvider/Path/Path";
import createNewFilePathUtils from "./createNewFilePathUtils";

describe("createNewFilePathUtils", () => {
	describe("Генерирует новое название файла", () => {
		test("При добавлении в корень", () => {
			const basePath = new Path("docs/.doc_root.yaml");
			const brothers = [new Path("docs/path1"), new Path("docs/new-article.md")];

			const output = new Path("docs/new-article-2.md");

			expect(createNewFilePathUtils.create(basePath, brothers)).toEqual(output);
		});
		describe("При перемещения", () => {
			describe("Если название файл совпадает", () => {
				test("С одним из братьев", () => {
					const basePath = new Path("docs/.doc_root.yaml");
					const brothers = [new Path("docs/path1"), new Path("docs/new-article.md")];

					const path = new Path("docs/test/new-article.md");

					const output = new Path("docs/new-article-2.md");

					expect(createNewFilePathUtils.move(basePath, path, false, brothers)).toEqual(output);
				});
				test("С несколькими братьями", () => {
					const basePath = new Path("docs/.doc_root.yaml");
					const brothers = [
						new Path("docs/path1"),
						new Path("docs/new-article.md"),
						new Path("docs/new-article-2.md"),
					];

					const path = new Path("docs/test/new-article.md");

					const output = new Path("docs/new-article-3.md");

					expect(createNewFilePathUtils.move(basePath, path, false, brothers)).toEqual(output);
				});
			});
			test("Без братьев", () => {
				const basePath = new Path("docs/.doc_root.yaml");

				const path = new Path("docs/test/new-article.md");

				const output = new Path("docs/new-article.md");

				expect(createNewFilePathUtils.move(basePath, path, false)).toEqual(output);
			});
		});
	});
});
