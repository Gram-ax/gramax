import getApplication from "@app/node/app";
import TestContext from "@app/test/TestContext";
import getItemRef from "../../workspace/test/getItemRef";

const getSecurityRulesData = async () => {
	const app = await getApplication();

	const workspace = app.wm.current();
	const categoryTestCatalog = await workspace.getCatalog("RulesCategoryTestCatalog");
	const catalogTestCatalog = await workspace.getCatalog("RulseCatalogTestCatalog");
	const articleTestCatalog = await workspace.getCatalog("RulseArticleTestCatalog");

	const categoryItemRef = getItemRef(categoryTestCatalog, "category/_index.md");
	const articleItemRef = getItemRef(articleTestCatalog, "category/testRules_en.md");
	const articleRuItemRef = getItemRef(articleTestCatalog, "category/testRules.md");

	return {
		app,
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
			const { app, articleRuItemRef, articleTestCatalog } = await getSecurityRulesData();

			const sitePresenter = app.sitePresenterFactory.fromContext(new TestContext());

			const links = await sitePresenter.getCatalogNav(articleTestCatalog, "");

			expect(links.find((f) => f.ref.path == articleRuItemRef.path.value)).toBeUndefined();
		});

		test("category", async () => {
			const { app, categoryItemRef, categoryTestCatalog } = await getSecurityRulesData();

			const sitePresenter = app.sitePresenterFactory.fromContext(new TestContext());

			const links = await sitePresenter.getCatalogNav(categoryTestCatalog, "");
			expect(links.find((f) => f.ref.path == categoryItemRef.path.value)).toBeUndefined();
		});
	});
});
