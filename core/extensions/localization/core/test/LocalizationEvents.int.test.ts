import getApp from "@app/browser/app";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
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
