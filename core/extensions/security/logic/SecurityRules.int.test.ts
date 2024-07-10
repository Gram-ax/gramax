import getApplication from "@app/node/app";
import Navigation from "../../navigation/catalog/main/logic/Navigation";
import getItemRef from "../../workspace/test/getItemRef";
import SecurityRules from "./SecurityRules";
import User from "./User/User";

const getSecurityRulesData = async () => {
	const app = await getApplication();

	const user = new User();
	const nav = new Navigation();
	const sr = new SecurityRules(user, app.customArticlePresenter);

	const workspace = app.wm.current();
	const categoryTestCatalog = await workspace.getCatalog("RulesCategoryTestCatalog");
	const catalogTestCatalog = await workspace.getCatalog("RulseCatalogTestCatalog");
	const articleTestCatalog = await workspace.getCatalog("RulseArticleTestCatalog");

	const categoryItemRef = getItemRef(categoryTestCatalog, "category/_index.md");
	const articleItemRef = getItemRef(articleTestCatalog, "category/testRules_en.md");
	const articleRuItemRef = getItemRef(articleTestCatalog, "category/testRules.md");

	return {
		nav,
		sr,
		articleRuItemRef,
		articleItemRef,
		articleTestCatalog,
		catalogTestCatalog,
		categoryItemRef,
		categoryTestCatalog,
	};
};

describe("Security Rules фильтрует приватные", () => {
	describe("item", () => {
		test("article", async () => {
			const { sr, nav, articleRuItemRef, articleTestCatalog } = await getSecurityRulesData();

			const filter = sr.getNavRules().itemRule;
			const item = articleTestCatalog.findArticleByItemRef(articleRuItemRef);
			const itemLink = (await nav.getCatalogNav(articleTestCatalog, item.logicPath))[0];
			expect(filter(articleTestCatalog, item, itemLink)).toEqual(false);
		});

		test("category", async () => {
			const { sr, nav, categoryItemRef, categoryTestCatalog } = await getSecurityRulesData();

			const filter = sr.getNavRules().itemRule;
			const item = categoryTestCatalog.findCategoryByItemRef(categoryItemRef);
			const itemLink = (await nav.getCatalogNav(categoryTestCatalog, item.logicPath))[0];
			expect(filter(categoryTestCatalog, item, itemLink)).toEqual(false);
		});
	});

	test("catalog", async () => {
		const { sr, nav, catalogTestCatalog } = await getSecurityRulesData();

		const filter = sr.getNavRules().catalogRule;
		const catalogLink = await nav.getCatalogLink(catalogTestCatalog);

		expect(filter(catalogTestCatalog, catalogLink)).toEqual(false);
	});

	test("relatedLinks", async () => {
		const { sr, nav, catalogTestCatalog } = await getSecurityRulesData();

		const filter = sr.getNavRules().relatedLinkRule;
		const relatedLinks = nav.getRelatedLinks(catalogTestCatalog);

		expect(filter(catalogTestCatalog, relatedLinks[0])).toEqual(false);
	});

	test("article", async () => {
		const { sr, articleRuItemRef, articleTestCatalog } = await getSecurityRulesData();

		const filter = sr.getItemFilter();
		const article = articleTestCatalog.findArticleByItemRef(articleRuItemRef);

		expect(filter(article, articleTestCatalog)).toEqual(false);
	});
});
