import getApplication from "@app/node/app";
import getItemRef from "../../../../logic/Library/test/getItemRef";
import Navigation from "../../../navigation/catalog/main/logic/Navigation";
import { defaultLanguage } from "../model/Language";
import LocalizationRules from "./LocalizationRules";

const getLocalizationRulesData = async () => {
	const app = await getApplication();

	const nav = new Navigation();
	const lr = new LocalizationRules(defaultLanguage, app.customArticlePresenter);

	const catalogTestCatalog = await app.lib.getCatalog("RulseCatalogTestCatalog");
	const articleTestCatalog = await app.lib.getCatalog("RulseArticleTestCatalog");

	const articleItemRef = getItemRef(articleTestCatalog, "category/testRules_en.md");
	const indexArticleItemRef = getItemRef(articleTestCatalog, "category/_index_en.md");

	return {
		nav,
		lr,
		articleItemRef,
		indexArticleItemRef,
		articleTestCatalog,
		catalogTestCatalog,
	};
};

describe("Localization Rules правильно фильтрует", () => {
	describe("item", () => {
		test("category", async () => {
			const { nav, lr, indexArticleItemRef, articleTestCatalog } = await getLocalizationRulesData();

			const filter = lr.getNavRules().itemRule;
			const item = articleTestCatalog.findCategoryByItemRef(indexArticleItemRef);
			const itemLink = (await nav.getCatalogNav(articleTestCatalog, item.logicPath))[0];
			expect(filter(articleTestCatalog, item, itemLink)).toEqual(false);
		});

		test("article", async () => {
			const { nav, lr, articleItemRef, articleTestCatalog } = await getLocalizationRulesData();
			const filter = lr.getNavRules().itemRule;
			const item = articleTestCatalog.findArticleByItemRef(articleItemRef);
			const itemLink = (await nav.getCatalogNav(articleTestCatalog, item.logicPath))[0];

			expect(filter(articleTestCatalog, item, itemLink)).toEqual(false);
		});
	});

	test("catalog", async () => {
		const { nav, lr, catalogTestCatalog } = await getLocalizationRulesData();
		const filter = lr.getNavRules().catalogRule;
		const catalogLink = await nav.getCatalogLink(catalogTestCatalog, catalogTestCatalog.getName());

		expect(filter(catalogTestCatalog, catalogLink)).toEqual(false);
	});

	test("article", async () => {
		const { lr, articleItemRef, articleTestCatalog } = await getLocalizationRulesData();
		const filter = lr.getItemFilter();
		const article = articleTestCatalog.findArticleByItemRef(articleItemRef);

		expect(filter(article, articleTestCatalog)).toEqual(false);
	});
});
