import getApp from "@app/browser/app";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import LocalizationRules from "@ext/localization/core/events/LocalizationEvents";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import Navigation from "@ext/navigation/catalog/main/logic/Navigation";
import { resolve } from "path";

process.env.ROOT_PATH = resolve(__dirname, "lr_tests");

const p = (s: string) => new Path(s);

const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

const app = async () => {
	delete global.app;
	delete global.commands;

	const app = await getApp();
	const fp = app.wm.current().getFileProvider();
	const wm = app.wm.current();
	return { app, fp, wm };
};

describe("LocalizationEvents", () => {
	beforeEach(async () => {
		await dfp.write(p("catalog/a.md"), "ru");
		await dfp.write(p("catalog/b/_index.md"), "ru");
		await dfp.write(p("catalog/b/new-article.md"), "ru");

		await dfp.write(p("catalog/en/_index.md"), "");
		await dfp.write(p("catalog/en/a.md"), "en");
		await dfp.write(p("catalog/en/b/_index.md"), "en");
		await dfp.write(p("catalog/en/b/new-article.md"), "en");

		await dfp.write(p("catalog/fr/_index.md"), "");
		await dfp.write(p("catalog/fr/a.md"), "fr");
		await dfp.write(p("catalog/fr/b/_index.md"), "fr");
		await dfp.write(p("catalog/fr/b/new-article.md"), "fr");
	});

	afterEach(async () => {
		await dfp.delete(p("."));
		delete global.app;
	});

	afterAll(async () => {
		await dfp.delete(p("."));
	});

	test("рендерит дерево статей, если стандартный язык не указан (не используется)", async () => {
		await dfp.write(p("catalog/.doc-root.yaml"), "");
		const { wm } = await app();

		const catalog = await wm.getContextlessCatalog("catalog");
		expect(catalog.findArticle("catalog/a", [])?.content).toBe("ru");
		expect(catalog.findArticle("catalog/en/a", [])?.content).toBe("en");
		expect(catalog.findArticle("catalog/fr/a", [])?.content).toBe("fr");
		expect(catalog.findArticle("catalog/not-exist", [])?.content).toBeUndefined();
	});

	test("рендерит дерево статей и добавляет недостающие языки, если стандартный язык указан и имеется несколько языков", async () => {
		await dfp.write(
			p("catalog/.doc-root.yaml"),
			`language: ru
    supportedLanguages:
      - ru
      - en`,
		);
		const { wm } = await app();

		const catalog = await wm.getContextlessCatalog("catalog");
		expect(catalog.findArticle("catalog/a", [])?.content).toBe("ru");
		expect(catalog.findArticle("catalog/en/a", [])?.content).toBe("en");
		expect(catalog.findArticle("catalog/fr/a", [])?.content).toBe("fr");
		expect(catalog.findArticle("catalog/not-exist", [])?.content).toBeUndefined();
	});

	test("добавляет стандартный удаляет ненужные языки из .doc-root.yaml supportedLanguages", async () => {
		await dfp.write(
			p("catalog/.doc-root.yaml"),
			`language: ru
supportedLanguages:
  - zh`,
		);
		const { wm } = await app();

		const catalog = await wm.getContextlessCatalog("catalog");

		expect(catalog.props.supportedLanguages).toContain("ru");
		expect(catalog.props.supportedLanguages).not.toContain("zh");
	});
});

describe("searchCommand LocalizationEvents", () => {
	beforeEach(async () => {
		await dfp.write(p("catalog/a.md"), "ru");
		await dfp.write(p("catalog/b/_index.md"), "ru");
		await dfp.write(p("catalog/b/new-article.md"), "ru");

		await dfp.write(p("catalog/en/_index.md"), "");
		await dfp.write(p("catalog/en/a.md"), "en");
		await dfp.write(p("catalog/en/b/_index.md"), "en");
		await dfp.write(p("catalog/en/b/new-article.md"), "en");

		await dfp.write(p("catalog/fr/_index.md"), "");
		await dfp.write(p("catalog/fr/a.md"), "fr");
		await dfp.write(p("catalog/fr/b/_index.md"), "fr");
		await dfp.write(p("catalog/fr/b/new-article.md"), "fr");
	});

	afterEach(async () => {
		await dfp.delete(p("."));
		delete global.app;
	});

	afterAll(async () => {
		await dfp.delete(p("."));
	});

	const setupLocalization = async (currentLanguage: ContentLanguage) => {
		await dfp.write(
			p("catalog/.doc-root.yaml"),
			`language: ru
supportedLanguages:
  - ru
  - en
  - fr`,
		);
		const { wm } = await app();
		const nav = new Navigation();
		const lr = new LocalizationRules(nav, currentLanguage);
		const catalog = await wm.getContextlessCatalog("catalog");
		return { lr, catalog };
	};

	test("строго фильтрует по языку", async () => {
		const { lr, catalog } = await setupLocalization(ContentLanguage.fr);
		const strictFilter = [lr.getItemFilter({ requireExactLanguageMatch: true })];
		const items = catalog.getItems(strictFilter);
		const paths = items.map((item) => item.logicPath);
		expect(paths).toEqual(
			expect.arrayContaining(["catalog/fr", "catalog/fr/a", "catalog/fr/b", "catalog/fr/b/new-article"]),
		);
		expect(paths.length).toBe(4);
	});

	test("не фильтрует по языку", async () => {
		const { lr, catalog } = await setupLocalization(ContentLanguage.fr);
		const looseFilter = [lr.getItemFilter({ requireExactLanguageMatch: false })];
		const items = catalog.getItems(looseFilter);
		const paths = items.map((item) => item.logicPath);
		expect(paths).toEqual(
			expect.arrayContaining([
				"catalog/a",
				"catalog/b",
				"catalog/b/new-article",
				"catalog/en/a",
				"catalog/en/b",
				"catalog/en/b/new-article",
				"catalog/fr",
				"catalog/fr/a",
				"catalog/fr/b",
				"catalog/fr/b/new-article",
			]),
		);
		expect(paths.length).toBe(10);
	});

	test("строгая фильтрация по стандартному языку каталога", async () => {
		const { lr, catalog } = await setupLocalization(undefined);
		const strictFilter = [lr.getItemFilter({ requireExactLanguageMatch: true })];
		const items = catalog.getItems(strictFilter);
		const paths = items.map((item) => item.logicPath);
		expect(paths).toEqual(expect.arrayContaining(["catalog/a", "catalog/b", "catalog/b/new-article"]));
		expect(paths.length).toBe(3);
	});
});
