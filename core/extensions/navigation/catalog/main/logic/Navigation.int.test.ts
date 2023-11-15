import getApplication from "@app/node/app";
import HiddenRule from "../../../../../logic/FileStructue/Rules/HiddenRules/HiddenRule";
import getItemRef from "../../../../../logic/Library/test/getItemRef";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import LocalizationRules from "../../../../localization/core/rules/LocalizationRules";
import SecurityRules from "../../../../security/logic/SecurityRules";
import User from "../../../../security/logic/User/User";
import Navigation from "./Navigation";

const getNavigationData = async () => {
	const app = await getApplication();
	const errorArticlesProvider = app.errorArticlesProvider;
	const nav = new Navigation();

	const user = new User();
	const hr = new HiddenRule(errorArticlesProvider);
	const lr = new LocalizationRules(errorArticlesProvider, defaultLanguage);
	const sr = new SecurityRules(errorArticlesProvider, user);

	nav.addRules({ itemFilter: hr.getItemRule() });
	nav.addRules({ catalogFilter: lr.getNavCatalogRule(), itemFilter: lr.getNavItemRule() });
	nav.addRules({
		catalogFilter: sr.getNavCatalogRule(),
		itemFilter: sr.getNavItemRule(),
		relatedLinkFilter: sr.getNavRelationRule(),
	});

	const navIndexArticleTestCatalog = await app.lib.getCatalog("NavigationIndexCatalog");
	const navTestCatalog = await app.lib.getCatalog("NavigationArticleCatalog");

	const navIndexArticleItemRef = getItemRef(navIndexArticleTestCatalog, "category/_index.md");
	const navEmptyCategoryItemRef = getItemRef(navTestCatalog, "normalArticle.md");

	return { nav, navIndexArticleTestCatalog, navIndexArticleItemRef, navTestCatalog, navEmptyCategoryItemRef };
};

describe("Navigation правильно", () => {
	test("выдаёт навигацию, если в папке один index article", async () => {
		const { nav, navIndexArticleTestCatalog, navIndexArticleItemRef } = await getNavigationData();
		const catalog = navIndexArticleTestCatalog;
		const currentItemLogicPath = navIndexArticleItemRef;

		const navItemLinks = await nav.getCatalogNav(catalog, currentItemLogicPath.path.value);

		expect(navItemLinks.length).toEqual(1);
	});

	test("фильтрует навигацию в каталоге по правилам", async () => {
		const { nav, navTestCatalog, navEmptyCategoryItemRef } = await getNavigationData();
		const catalog = navTestCatalog;
		const currentItemLogicPath = navEmptyCategoryItemRef;

		const navItemLinks = await nav.getCatalogNav(catalog, currentItemLogicPath.path.value);

		expect(navItemLinks.length).toEqual(1);
	});
});
