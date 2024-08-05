import getApplication from "@app/node/app";
import HiddenRules from "../../../../../logic/FileStructue/Rules/HiddenRules/HiddenRule";
import { defaultLanguage } from "../../../../localization/core/model/Language";
import LocalizationRules from "../../../../localization/core/rules/LocalizationRules";
import SecurityRules from "../../../../security/logic/SecurityRules";
import User from "../../../../security/logic/User/User";
import getItemRef from "../../../../workspace/test/getItemRef";
import Navigation from "./Navigation";

const getNavigationData = async () => {
	const app = await getApplication();
	const errorArticlesProvider = app.customArticlePresenter;
	const nav = new Navigation();

	const user = new User();
	const hr = new HiddenRules(errorArticlesProvider);
	const lr = new LocalizationRules(defaultLanguage, errorArticlesProvider);
	const sr = new SecurityRules(user, errorArticlesProvider);

	nav.addRules(hr.getNavRules());
	nav.addRules(lr.getNavRules());
	nav.addRules(sr.getNavRules());
	
	const navCatalogEntries = app.wm.current().getCatalogEntries();

	const navIndexArticleTestCatalog = await app.wm.current().getCatalog("NavigationIndexCatalog");
	const navTestCatalog = await app.wm.current().getCatalog("NavigationArticleCatalog");

	const navIndexArticleItemRef = getItemRef(navIndexArticleTestCatalog, "category/_index.md");
	const navEmptyCategoryItemRef = getItemRef(navTestCatalog, "normalArticle.md");

	return { nav, navIndexArticleTestCatalog, navIndexArticleItemRef, navTestCatalog, navEmptyCategoryItemRef, navCatalogEntries };
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

	test("возвращает каталоги в правильном порядке", async () => {
		const { nav, navCatalogEntries } = await getNavigationData();

		const catalogLinks = await nav.getCatalogsLink(navCatalogEntries);

		expect(catalogLinks.map((cl) => cl.title)).toEqual([
			"Многоуровневый каталог",
			"data",
			"NavigationArticleCatalog",
			"NavigationIndexCatalog",
			"RefsCatalog",
			"RulesCategoryTestCatalog",
			"RulseArticleTestCatalog",
			"Test-catalog",
			"Test-catalog",
			"Test-catalog",
			"Последний каталог",
		]);
	});
});
