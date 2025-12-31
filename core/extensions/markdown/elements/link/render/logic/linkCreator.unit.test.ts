import Path from "../../../../../../logic/FileProvider/Path/Path";
import linkCreater from "./linkCreator";

describe("linkCreator", () => {
	describe("correctly returns catalog name", () => {
		describe("with docs folder", () => {
			test("different catalog via ./../../../", () => {
				const docsPath = new Path("id-catalog/docs");
				const articlePath = new Path("id-catalog/docs/folder/123.md");
				const href = "./../../../new-catalog-2/erqerqer";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("new-catalog-2");
			});

			test("different catalog via ./../../../../ from nested folder", () => {
				const docsPath = new Path("id-catalog/docs");
				const articlePath = new Path("id-catalog/docs/folder/456/_index.md");
				const href = "./../../../../new-catalog-2/erqerqer";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("new-catalog-2");
			});

			test("current catalog via ./", () => {
				const docsPath = new Path("id-catalog/docs");
				const articlePath = new Path("id-catalog/docs/folder/123.md");
				const href = "./456/_index";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("id-catalog");
			});

			test("current catalog via ./../../ to the same folder", () => {
				const docsPath = new Path("id-catalog/docs");
				const articlePath = new Path("id-catalog/docs/folder/456/rkwjtlweklte.md");
				const href = "./../123";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("id-catalog");
			});

			test("current catalog via ./_index", () => {
				const docsPath = new Path("id-catalog/docs");
				const articlePath = new Path("id-catalog/docs/folder/456/_index.md");
				const href = "./_index";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("id-catalog");
			});
		});

		describe("without docs folder", () => {
			test("different catalog via ./../", () => {
				const docsPath = new Path("id-catalog");
				const articlePath = new Path("id-catalog/123.md");
				const href = "./../new-catalog-2/erqerqer";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("new-catalog-2");
			});

			test("different catalog via ./../../", () => {
				const docsPath = new Path("id-catalog");
				const articlePath = new Path("id-catalog/456/_index.md");
				const href = "./../../new-catalog-2/erqerqer";
				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);
				expect(result).toBe("new-catalog-2");
			});

			test("current catalog via ./", () => {
				const docsPath = new Path("id-catalog");
				const articlePath = new Path("id-catalog/123.md");
				const href = "./456/_index";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("id-catalog");
			});

			test("current catalog via ./../../ to the same folder", () => {
				const docsPath = new Path("id-catalog");
				const articlePath = new Path("id-catalog/456/rkwjtlweklte.md");
				const href = "./../123";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("id-catalog");
			});

			test("current catalog via ./_index", () => {
				const docsPath = new Path("id-catalog");
				const articlePath = new Path("id-catalog/456/_index.md");
				const href = "./_index";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("id-catalog");
			});

			test("catalog name when articlePath is in .gramax directory", () => {
				const docsPath = new Path("root-catalog/docs");
				const articlePath = new Path("root-catalog/.gramax/snippets/article.md");
				const href = "./../../../other-catalog/some-file";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("other-catalog");
			});
		});

		describe("with .gramax directory context", () => {
			test("different catalog from .gramax context", () => {
				const docsPath = new Path("catalog/docs");
				const articlePath = new Path("catalog/.gramax/snippets/article.md");
				const href = "./../../../other-catalog/docs/file";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("other-catalog");
			});

			test("same catalog from .gramax context via relative path", () => {
				const docsPath = new Path("catalog/docs");
				const articlePath = new Path("catalog/.gramax/snippets/article.md");
				const href = "./../folder2/file";

				const result = linkCreater.getCatalogNameFromPath(href, articlePath, docsPath);

				expect(result).toBe("catalog");
			});
		});
	});

	describe("correctly returns path to article", () => {
		const mainPath = new Path("/bi/3.Subsystems Architecture/eCompass_Export");

		describe("with docs folder", () => {
			const rootPath = new Path("kc-docs/docs");

			test("via single dot", () => {
				const href = "./article.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(
					new Path("kc-docs/docs/bi/3.Subsystems Architecture/eCompass_Export/article.md"),
				);
			});

			test("via two dots with dot", () => {
				const href = "./../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("via two dots without dot", () => {
				const href = "../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("via three dots", () => {
				const rootPath = new Path("kc-docs/docs");
				const mainPath = new Path("/bi/3.Subsystems Architecture/eCompass_Export");
				const href = ".../bi/6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("via three dots with mainPath = '/new'", () => {
				const rootPath = new Path("kc-docs/docs");
				const mainPath = new Path("/new");
				const href = ".../bi/6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});
		});

		describe("without docs folder", () => {
			const rootPath = new Path("kc-docs");

			test("via single dot", () => {
				const href = "./article.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/3.Subsystems Architecture/eCompass_Export/article.md"));
			});

			test("via two dots with dot", () => {
				const href = "./../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("via two dots without dot", () => {
				const href = "../../6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});

			test("via three dots", () => {
				const href = ".../bi/6.DWH/eCompass_Export/Products/_index.md";

				const result = linkCreater.getLinkPath(rootPath, mainPath, href);

				expect(result).toEqual(new Path("kc-docs/bi/6.DWH/eCompass_Export/Products/_index.md"));
			});
		});
	});

	describe("correctly returns root path", () => {
		test("returns docsPath when articlePath is within docsPath", () => {
			const docsPath = new Path("catalog/docs");
			const articlePath = new Path("catalog/docs/folder/article.md");

			const result = (linkCreater as any)._getArticleProviderRootPath(articlePath, docsPath);

			expect(result).toEqual(docsPath);
		});

		test("returns rootDirectory when articlePath is within .gramax directory", () => {
			const docsPath = new Path("catalog/docs");
			const articlePath = new Path("catalog/.gramax/snippets/article.md");

			const result = (linkCreater as any)._getArticleProviderRootPath(articlePath, docsPath);

			expect(result).toEqual(docsPath.rootDirectory);
		});

		test("handles nested docsPath correctly", () => {
			const docsPath = new Path("catalog/docs/docs");
			const articlePath = new Path("catalog/docs/docs/deep/folder/article.md");

			const result = (linkCreater as any)._getArticleProviderRootPath(articlePath, docsPath);

			expect(result).toEqual(docsPath);
		});

		test("handles .gramax path with nested structure", () => {
			const docsPath = new Path("catalog/docs/docs");
			const articlePath = new Path("catalog/.gramax/deep/folder/article.md");

			const result = (linkCreater as any)._getArticleProviderRootPath(articlePath, docsPath);

			expect(result).toEqual(docsPath.rootDirectory);
		});
	});
});
