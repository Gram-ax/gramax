import Path from "../../../../../../logic/FileProvider/Path/Path";
import linkCreater from "./linkCreator";

describe("linkCreator", () => {
	describe("корректно выдает путь до статьи", () => {
		const mainPath = new Path("/bi/3.Subsystems Architecture/eCompass_Export");

		describe("с папкой docs", () => {
			const rootPath = new Path("kc-docs/docs");

			test("через одну точку", () => {
				const href = "./article.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(
					new Path("kc-docs/docs/bi/3.Subsystems Architecture/eCompass_Export/article.md"),
				);
			});

			test("через две точки с точкой", () => {
				const href = "./../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("через две точки без точки", () => {
				const href = "../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("через три точки", () => {
				const rootPath = new Path("kc-docs/docs");
				const mainPath = new Path("/bi/3.Subsystems Architecture/eCompass_Export");
				const href = ".../bi/6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("через три точки с mainPath = '/new'", () => {
				const rootPath = new Path("kc-docs/docs");
				const mainPath = new Path("/new");
				const href = ".../bi/6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});
		});

		describe("без папки docs", () => {
			const rootPath = new Path("kc-docs");

			test("через одну точку", () => {
				const href = "./article.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/3.Subsystems Architecture/eCompass_Export/article.md"));
			});

			test("через две точки с точкой", () => {
				const href = "./../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("через две точки без точки", () => {
				const href = "../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("через три точки", () => {
				const href = ".../bi/6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});
		});
	});
});
