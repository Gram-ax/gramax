import getApp from "@app/browser/app";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { resolve } from "path";

process.env.ROOT_PATH = resolve(__dirname, "tests");

const p = (s: string) => new Path(s);

const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

const makeApp = async () => {
	delete global.app;
	delete global.commands;

	const app = await getApp();
	const fp = app.wm.current().getFileProvider();
	const wm = app.wm.current();

	const makeResourceUpdater = (catalog: Catalog) =>
		new ResourceUpdater(
			app.contextFactory.fromBrowser("ru" as any, {}),
			catalog,
			app.parser,
			app.parserContextFactory,
			app.formatter,
		);

	return { app, fp, wm, makeResourceUpdater };
};

describe("FSLocalizationEvents", () => {
	beforeEach(async () => {
		await dfp.write(
			p("catalog/.doc-root.yaml"),
			`language: ru
supportedLanguages:
  - ru
  - en`,
		);

		await dfp.write(p("catalog/article.md"), "ru");
		await dfp.write(p("catalog/category/_index.md"), "ru");
		await dfp.write(p("catalog/category/new-article.md"), "ru");

		await dfp.write(p("catalog/en/_index.md"), "");
		await dfp.write(p("catalog/en/article.md"), "ru");
		await dfp.write(p("catalog/en/category/_index.md"), "ru");
		await dfp.write(p("catalog/en/category/new-article.md"), "ru");

		await dfp.write(p("catalog/test.md"), "");
		await dfp.write(p("catalog/category/_index.md"), "");
		await dfp.write(p("catalog/category/q.md"), "");

		await dfp.write(p("catalog/en/test.md"), "");
		await dfp.write(p("catalog/1category/_index.md"), "");
		await dfp.write(p("catalog/1category/q.md"), "");
		await dfp.write(p("catalog/en/1category/_index.md"), "");
		await dfp.write(p("catalog/en/1category/q.md"), "");
	});

	afterEach(async () => {
		await dfp.delete(p("."));
		delete global.app;
	});

	afterAll(async () => {
		await dfp.delete(p("."));
	});

	describe("переименовывает файлы статей на всех языках", () => {
		const doTest = async (useInner: boolean) => {
			const { wm, makeResourceUpdater } = await makeApp();
			const catalog = await wm.getCatalog("catalog");

			expect(catalog.findArticle("catalog/article", [])).not.toBeNull();
			expect(catalog.findArticle("catalog/en/article", [])).not.toBeNull();

			await catalog.updateItemProps(
				{ logicPath: useInner ? "catalog/en/article" : "catalog/article", fileName: "article-renamed" } as any,
				makeResourceUpdater,
			);

			expect(catalog.findArticle("catalog/article", [])).toBeNull();
			expect(catalog.findArticle("catalog/en/article", [])).toBeNull();

			const renamedItemMain = catalog.findArticle("catalog/article-renamed", []);
			expect(renamedItemMain).not.toBeNull();
			expect(renamedItemMain.ref.path.value).toEqual("catalog/article-renamed.md");

			const renamedItem = catalog.findArticle("catalog/en/article-renamed", []);
			expect(renamedItem).not.toBeNull();
			expect(renamedItem.ref.path.value).toEqual("catalog/en/article-renamed.md");
		};

		test("из основного каталога", async () => await doTest(false));
		test("из дочернего каталога", async () => await doTest(true));
	});

	describe("перемещает статьи во всех языках", () => {
		const doTest = async (useInner: boolean, from: string, to: string) => {
			const { wm, fp, app, makeResourceUpdater } = await makeApp();

			const catalog = await wm.getCatalog("catalog");

			const item = catalog.findArticle("catalog/" + from, []);
			expect(item).not.toBeNull();
			const itemEn = catalog.findArticle("catalog/en/" + from, []);
			expect(itemEn).not.toBeNull();

			await catalog.moveItem(
				useInner ? itemEn.ref : item.ref,
				fp.getItemRef(item.ref.path.getNewName(to)),
				makeResourceUpdater,
				app.rp,
			);
			await catalog.update(app.rp);

			expect(catalog.findArticle("catalog/" + from, [])).toBeNull();
			expect(catalog.findArticle("catalog/en/" + from, [])).toBeNull();

			const renamedItemInner = catalog.findArticle("catalog/en/" + to, []);
			expect(renamedItemInner).not.toBeNull();
			expect(renamedItemInner.ref.path.value).toEqual(`catalog/en/${to}.md`);
			expect(await fp.exists(renamedItemInner.ref.path)).toBeTruthy();

			const renamedItem = catalog.findArticle("catalog/" + to, []);
			expect(renamedItem).not.toBeNull();
			expect(renamedItem.ref.path.value).toEqual(`catalog/${to}.md`);
			expect(await fp.exists(renamedItem.ref.path)).toBeTruthy();
		};

		test("в основном каталоге", () => doTest(false, "article", "article-moved"));
		test("в дочернем каталоге", () => doTest(true, "article", "article-moved"));
	});

	describe("перемещает категории в основном и дочернем каталогах", () => {
		const doTest = async (useInner: boolean) => {
			const { wm, fp, app, makeResourceUpdater } = await makeApp();

			const catalog = await wm.getCatalog("catalog");

			const item = catalog.findArticle("catalog/1category", []);
			expect(item).not.toBeNull();
			const itemEn = catalog.findArticle("catalog/en/1category", []);
			expect(itemEn).not.toBeNull();

			await catalog.moveItem(
				useInner ? item.ref : itemEn.ref,
				fp.getItemRef(
					item.ref.path.parentDirectoryPath.getNewName("category-moved").join(new Path("_index.md")),
				),
				makeResourceUpdater,
				app.rp,
			);
			await catalog.update(app.rp);

			expect(catalog.findArticle("catalog/en/1category", [])).toBeNull();
			expect(catalog.findArticle("catalog/1category", [])).toBeNull();

			const renamedItemInner = catalog.findArticle("catalog/en/category-moved", []);
			expect(renamedItemInner).not.toBeNull();
			expect(renamedItemInner.ref.path.value).toEqual(`catalog/en/category-moved/_index.md`);
			expect(await fp.exists(renamedItemInner.ref.path)).toBeTruthy();

			const renamedItem = catalog.findArticle("catalog/category-moved", []);
			expect(renamedItem).not.toBeNull();
			expect(renamedItem.ref.path.value).toEqual(`catalog/category-moved/_index.md`);
			expect(await fp.exists(renamedItem.ref.path)).toBeTruthy();
		};

		test("в основном каталоге", () => doTest(false));
		test("в дочернем каталоге", () => doTest(true));
	});

	describe("удаляет статью в основном и дочернем каталогах", () => {
		const doTest = async (useInner: boolean) => {
			const { wm, app, fp } = await makeApp();

			const catalog = await wm.getCatalog("catalog");
			const articleParser = new ArticleParser(
				app.contextFactory.fromBrowser(null, null),
				app.parser,
				app.parserContextFactory,
			);

			expect(catalog.findArticle("catalog/article", [])?.logicPath).toEqual("catalog/article");

			expect(catalog.findArticle("catalog/en/article", [])?.logicPath).toEqual("catalog/en/article");
			expect(await fp.exists(p("catalog/article.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/en/article.md"))).toBeTruthy();

			await catalog.deleteItem(
				fp.getItemRef(p(useInner ? "catalog/en/article.md" : "catalog/article.md")),
				articleParser,
			);

			expect(catalog.findArticle("catalog/article", [])?.logicPath).toBeUndefined();
			expect(catalog.findArticle("catalog/en/article", [])?.logicPath).toBeUndefined();
			expect(await fp.exists(p("catalog/article.md"))).toBeFalsy();
			expect(await fp.exists(p("catalog/en/article.md"))).toBeFalsy();
		};

		test("в основном каталоге", () => doTest(false));
		test("в дочернем каталоге", () => doTest(true));
	});

	describe("создаёт категорию из статьи в основном и дочернем каталогах", () => {
		const doTest = async (useInner: boolean) => {
			const { wm, fp, makeResourceUpdater } = await makeApp();

			const catalog = await wm.getCatalog("catalog");
			const parent = useInner
				? catalog.findArticle("catalog/en/article", [])?.ref
				: catalog.findArticle("catalog/article", [])?.ref;

			expect(parent).not.toBeNull();

			await catalog.createArticle(makeResourceUpdater, "", parent);

			const category = catalog.findArticle("catalog/article", [])?.type;
			expect(category).toEqual(ItemType.category);
			expect(await fp.exists(p("catalog/article/_index.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/article/new-article.md"))).toBeTruthy();

			const categoryInner = catalog.findArticle("catalog/en/article", [])?.type;
			expect(categoryInner).toEqual(ItemType.category);
			expect(await fp.exists(p("catalog/en/article/_index.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/en/article/new-article.md"))).toBeTruthy();
		};

		test("в основном каталоге", () => doTest(false));
		test("в дочернем каталоге", () => doTest(true));
	});
});
