import parseContent from "@ext/bugsnag/logic/parseContent";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("parseContent", () => {
	describe("Удаление контента и атрибутов в узлах", () => {
		test("should remove user data from article nodes", () => {
			const dirtyArticle = JSON.parse(readFileSync(resolve(__dirname, "article.json"), "utf-8"));
			const clearArticle = JSON.parse(readFileSync(resolve(__dirname, "clearArticle.json"), "utf-8"));

			const processArticle = parseContent(dirtyArticle);

			expect(processArticle).toEqual(clearArticle);
		});
	});
});
