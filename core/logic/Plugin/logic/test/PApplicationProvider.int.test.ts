import getApplication from "@app/node/app";
import TestContext from "@app/test/TestContext";
import PApplicationProvider from "@core/Plugin/logic/PApplicationProvider";
import PluginsCache from "@core/Plugin/logic/PluginsCache";
import itemRefConverter from "@core/Plugin/logic/utils/itemRefConverter";

const getCatalogs = async (catalogName: string) => {
	const app = await getApplication();
	const catalog = await app.lib.getCatalog(catalogName);
	const pluginsCache = new PluginsCache(app.cache);
	const pApplicationProvider = new PApplicationProvider(app.lib, app.htmlParser, pluginsCache);
	const pCatalog = (await (await pApplicationProvider.getApp("test", new TestContext())).catalogs.getAll()).find(
		(c) => c.getName() === catalogName,
	);
	return { catalog, pCatalog };
};

describe("PApplication", () => {
	describe("PCatalog", () => {
		describe("находит", () => {
			it("все item", async () => {
				const { catalog, pCatalog } = await getCatalogs("MultiLevelCatalog");

				const catalogItemRefPaths = catalog.getItems().map((i) => i.ref.path.value);
				const pCatalogItemRefPaths = pCatalog
					.getArticles()
					.map((i) => itemRefConverter.toItemRef(i.id).path.value);

				expect(catalogItemRefPaths).toEqual(pCatalogItemRefPaths);
			});
			it("item по id", async () => {
				const { pCatalog } = await getCatalogs("MultiLevelCatalog");
				const { id } = pCatalog.getArticles()[0];
				expect(pCatalog.getArticleById(id)).toBeTruthy();
			});
		});
		describe("не находит", () => {
			it("скрытые item", async () => {
				const { catalog, pCatalog } = await getCatalogs("RulseArticleTestCatalog");
				const catalogItemRefPaths = catalog.getItems();
				const pCatalogItemRefPaths = pCatalog.getArticles();

				expect(catalogItemRefPaths.length).toBe(2);
				expect(pCatalogItemRefPaths.length).toBe(0);
			});
		});
	});
});
