import getApplication from "@app/node/app";
import Navigation from "../../../navigation/catalog/main/logic/Navigation";
import getItemRef from "../../../workspace/test/getItemRef";
import { defaultLanguage } from "../model/Language";
import LocalizationRules from "./LocalizationRules";

const getLocalizationRulesData = async () => {
	const app = await getApplication();

	const nav = new Navigation();
	const lr = new LocalizationRules(defaultLanguage, app.customArticlePresenter);

	const catalogTestCatalog = await app.wm.current().getCatalog("RulseCatalogTestCatalog");
	const articleTestCatalog = await app.wm.current().getCatalog("RulseArticleTestCatalog");

	const articleItemRef = getItemRef(articleTestCatalog, "category/testRules_en.md");
	const articleRuItemRef = getItemRef(articleTestCatalog, "category/testRules.md");
	const indexArticleItemRef = getItemRef(articleTestCatalog, "category/_index_en.md");
	const indexArticleRuItemRef = getItemRef(articleTestCatalog, "category/_index.md");

	return {
		nav,
		lr,
		articleItemRef,
		articleRuItemRef,
		indexArticleItemRef,
		indexArticleRuItemRef,
		articleTestCatalog,
		catalogTestCatalog,
	};
};

describe("Localization Rules правильно фильтрует", () => {
	describe("item", () => {
		test("category", async () => {
			const { nav, lr, indexArticleRuItemRef, articleTestCatalog } = await getLocalizationRulesData();

			const filter = lr.getNavRules().itemRule;
			const item = articleTestCatalog.findCategoryByItemRef(indexArticleRuItemRef);
			const itemLink = (await nav.getCatalogNav(articleTestCatalog, item.logicPath))[0];
			expect(filter(articleTestCatalog, item, itemLink)).toEqual(true);
		});

		test("article", async () => {
			const { nav, lr, articleRuItemRef, articleTestCatalog } = await getLocalizationRulesData();
			const filter = lr.getNavRules().itemRule;
			const item = articleTestCatalog.findArticleByItemRef(articleRuItemRef);
			const itemLink = (await nav.getCatalogNav(articleTestCatalog, item.logicPath))[0];

			expect(filter(articleTestCatalog, item, itemLink)).toEqual(true);
		});
	});

	test("catalog", async () => {
		const { nav, lr, catalogTestCatalog } = await getLocalizationRulesData();
		const filter = lr.getNavRules().catalogRule;
		const catalogLink = await nav.getCatalogLink(catalogTestCatalog);

		expect(filter(catalogTestCatalog, catalogLink)).toEqual(false);
	});

	test("article", async () => {
		const { lr, articleRuItemRef, articleTestCatalog } = await getLocalizationRulesData();
		const filter = lr.getItemFilter();
		const article = articleTestCatalog.findArticleByItemRef(articleRuItemRef);

		expect(filter(article, articleTestCatalog)).toEqual(true);
	});
});
