import getApplication from "@app/node/app";
import getItemRef from "../../../Library/test/getItemRef";
import HiddenRule from "./HiddenRule";

const getHiddenRuleData = async () => {
	const app = await getApplication();
	const hr = new HiddenRule(app.errorArticlesProvider);

	const categoryTestCatalog = await app.lib.getCatalog("RulesCategoryTestCatalog");
	const articleTestCatalog = await app.lib.getCatalog("RulseArticleTestCatalog");

	const categoryItemRef = getItemRef(categoryTestCatalog, "category/_index.md");
	const articleItemRef = getItemRef(articleTestCatalog, "category/testRules_en.md");

	return { hr, articleItemRef, articleTestCatalog, categoryItemRef, categoryTestCatalog };
};

describe("HiddenRule правильно фильтрует", () => {
	describe("item", () => {
		test("article", async () => {
			const { hr, articleItemRef, articleTestCatalog } = await getHiddenRuleData();
			const filter = hr.getItemRule();
			const item = articleTestCatalog.findArticleByItemRef(articleItemRef);
			expect(filter(articleTestCatalog, item)).toEqual(false);
		});

		test("category", async () => {
			const { hr, categoryItemRef, categoryTestCatalog } = await getHiddenRuleData();
			const filter = hr.getItemRule();
			const item = categoryTestCatalog.findCategoryByItemRef(categoryItemRef);
			expect(filter(categoryTestCatalog, item)).toEqual(false);
		});
	});

	test("article", async () => {
		const { hr, articleItemRef, articleTestCatalog } = await getHiddenRuleData();
		const filter = hr.getFilterRule();
		const article = articleTestCatalog.findArticleByItemRef(articleItemRef);

		expect(filter(article)).toEqual(false);
	});
});
