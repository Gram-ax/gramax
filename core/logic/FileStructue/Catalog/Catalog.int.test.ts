import getApplication from "@app/node/app";
import Path from "../../FileProvider/Path/Path";

const getCatalogRefsData = async () => {
	const app = await getApplication();
	return app.lib.getCatalog("RefsCatalog");
};

describe("Catalog", () => {
	test("парвильно выдет статью по refLink", async () => {
		const catalogRefs = await getCatalogRefsData();

		const refLink = catalogRefs.getName() + "/ref:ref";
		const articlePath = new Path("RefsCatalog/path/article.md");

		const article = catalogRefs.findArticle(refLink, []);

		expect(article.ref.path).toEqual(articlePath);
	});

	test("конвертирует itemRefPath в относительный путь репозитория", async () => {
		const catalogRefs = await getCatalogRefsData();

		const itemRefPath = new Path("RefsCatalog/path/to/file/1.md");

		const catalogRef = catalogRefs.getRelativeRepPath(itemRefPath);

		expect(catalogRef).toEqual(new Path("path/to/file/1.md"));
	});
});
