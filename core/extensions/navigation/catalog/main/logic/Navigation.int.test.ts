import getApplication from "@app/node/app";
import Permission from "@ext/security/logic/Permission/Permission";
import HiddenRules from "../../../../../logic/FileStructue/Rules/HiddenRules/HiddenRule";
import LocalizationRules from "../../../../localization/core/events/LocalizationEvents";
import { ContentLanguage } from "../../../../localization/core/model/Language";
import SecurityRules from "../../../../security/logic/SecurityRules";
import User from "../../../../security/logic/User/User";
import getItemRef from "../../../../workspace/test/getItemRef";
import Navigation from "./Navigation";

const getNavigationData = async () => {
	const app = await getApplication();
	const errorArticlesProvider = app.customArticlePresenter;
	const nav = new Navigation();

	const user = new User(null, null, new Permission(["ReadCatalogContent"]));
	const hr = new HiddenRules(nav, errorArticlesProvider);
	const lr = new LocalizationRules(nav, ContentLanguage.ru, errorArticlesProvider);
	const sr = new SecurityRules(user, nav, errorArticlesProvider);

	hr.mount();
	lr.mount();
	sr.mount();

	const navCatalogEntries = app.wm.current().getAllCatalogs();

	const navIndexArticleTestCatalog = await app.wm.current().getContextlessCatalog("NavigationIndexCatalog");
	const navTestCatalog = await app.wm.current().getContextlessCatalog("NavigationArticleCatalog");

	const navIndexArticleItemRef = getItemRef(navIndexArticleTestCatalog, "category/_index.md");
	const navEmptyCategoryItemRef = getItemRef(navTestCatalog, "normalArticle.md");

	return {
		nav,
		navIndexArticleTestCatalog,
		navIndexArticleItemRef,
		navTestCatalog,
		navEmptyCategoryItemRef,
		navCatalogEntries,
	};
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

		const catalogLinks = await nav.getCatalogsLink(Array.from(navCatalogEntries.values()));

		expect(catalogLinks.map((cl) => cl.title)).toEqual([
			"NavigationArticleCatalog",
			"NavigationIndexCatalog",
			"Многоуровневый каталог",
			"data",
			"PropertyCatalog",
			"RefsCatalog",
			"RulesCategoryTestCatalog",
			"RulseArticleTestCatalog",
			"RulseCatalogTestCatalog",
			"Test-catalog",
			"Test-catalog",
			"Test-catalog",
			"Test-catalog",
			"Последний каталог",
		]);
	});
});
