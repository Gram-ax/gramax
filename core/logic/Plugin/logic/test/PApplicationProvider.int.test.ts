import getApplication from "@app/node/app";
import PApplicationProvider from "@core/Plugin/logic/PApplicationProvider";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import itemRefConverter from "@core/Plugin/logic/utils/itemRefConverter";

const getTestData = async () => {
	const app = await getApplication();

	const catalog = await app.lib.getCatalog("MultiLevelCatalog");
	const pluginsCache = new PluginsCache(app.cache);
	const pApplicationProvider = new PApplicationProvider(app.lib, app.htmlParser, pluginsCache);
	const pCatalog = (await (await pApplicationProvider.getApp("test")).catalogs.getAll()).find(
		(c) => c.getName() === "MultiLevelCatalog",
	);
	return { catalog, pCatalog };
};

describe("PApplication", () => {
	describe("PCatalog", () => {
		it("находит все item", async () => {
			const { catalog, pCatalog } = await getTestData();

			const catalogItemRefPaths = catalog.getItems().map((i) => i.ref.path.value);
			const pCatalogItemRefPaths = pCatalog.getArticles().map((i) => itemRefConverter.toItemRef(i.id).path.value);

			expect(catalogItemRefPaths).toEqual(pCatalogItemRefPaths);
		});
		it("находит item по id", async () => {
			const { pCatalog } = await getTestData();
			const { id } = pCatalog.getArticles()[0];
			expect(pCatalog.getArticleById(id)).toBeTruthy();
		});
	});
});
