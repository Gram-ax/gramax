import getApplication from "@app/node/app";
import getItemRef from "../../../../extensions/workspace/test/getItemRef";
import HiddenRules from "./HiddenRule";

const getHiddenRuleData = async () => {
	const app = await getApplication();
	const hr = new HiddenRules(null, app.customArticlePresenter);

	const categoryTestCatalog = await app.wm.current().getContextlessCatalog("RulesCategoryTestCatalog");
	const articleTestCatalog = await app.wm.current().getContextlessCatalog("RulseArticleTestCatalog");

	const categoryItemRef = getItemRef(categoryTestCatalog, "category/_index.md");
	const articleItemRef = getItemRef(articleTestCatalog, "category/testRules_en.md");
	const articleRuItemRef = getItemRef(articleTestCatalog, "category/testRules.md");

	return { hr, articleRuItemRef, articleItemRef, articleTestCatalog, categoryItemRef, categoryTestCatalog };
};

describe("HiddenRule правильно фильтрует", () => {
	describe("item", () => {
		test("article", async () => {
			const { hr, articleRuItemRef, articleTestCatalog } = await getHiddenRuleData();
			const filter = hr.getItemFilter();
			const item = articleTestCatalog.findArticleByItemRef(articleRuItemRef);
			expect(filter(item, articleTestCatalog)).toEqual(false);
		});

		test("category", async () => {
			const { hr, categoryItemRef, categoryTestCatalog } = await getHiddenRuleData();
			const filter = hr.getItemFilter();
			const item = categoryTestCatalog.findCategoryByItemRef(categoryItemRef);
			expect(filter(item, categoryTestCatalog)).toEqual(false);
		});
	});

	test("article", async () => {
		const { hr, articleRuItemRef, articleTestCatalog } = await getHiddenRuleData();
		const filter = hr.getItemFilter();
		const article = articleTestCatalog.findArticleByItemRef(articleRuItemRef);

		expect(filter(article, articleTestCatalog)).toEqual(false);
	});
});
