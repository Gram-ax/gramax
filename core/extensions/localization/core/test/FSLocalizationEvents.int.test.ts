import getApp from "@app/web/app";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import type { UpdateItemProps } from "@core/FileStructue/Item/Item";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import { resolveRootCategory } from "@ext/localization/core/catalogExt";
import { ContentLanguage } from "@ext/localization/core/model/Language";
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
	const ctx = await app.contextFactory.fromWeb({
		language: "ru",
	});

	const makeResourceUpdater = (catalog: Catalog) =>
		new ResourceUpdater(ctx, catalog, app.parser, app.parserContextFactory, app.formatter);

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
		await dfp.write(p("catalog/category/untitled.md"), "ru");

		await dfp.write(p("catalog/en/_index.md"), "");
		await dfp.write(p("catalog/en/article.md"), "ru");
		await dfp.write(p("catalog/en/category/_index.md"), "ru");
		await dfp.write(p("catalog/en/category/untitled.md"), "ru");

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
			const catalog = await wm.getContextlessCatalog("catalog");

			expect(catalog.findArticle("catalog/article", [])).not.toBeNull();
			expect(catalog.findArticle("catalog/en/article", [])).not.toBeNull();

			await catalog.updateItemProps(
				{
					logicPath: useInner ? "catalog/en/article" : "catalog/article",
					fileName: "article-renamed",
				} as unknown as UpdateItemProps,
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
		test.each([
			["основного", false],
			["дочернего", true],
		])("сразу обновляет дерево после переноса из %s языка", async (_, useInner) => {
			const { wm, fp, makeResourceUpdater } = await makeApp();
			const catalog = await wm.getContextlessCatalog("catalog");
			const item = catalog.findArticle("catalog/article", []);
			const itemEn = catalog.findArticle("catalog/en/article", []);
			const dragged = useInner ? itemEn : item;

			await catalog.moveItem(
				dragged.ref,
				fp.getItemRef(dragged.ref.path.getNewName("article-moved")),
				makeResourceUpdater,
			);

			expect(catalog.findArticle("catalog/article", [])).toBeNull();
			expect(catalog.findArticle("catalog/en/article", [])).toBeNull();
			expect(catalog.findArticle("catalog/article-moved", [])).not.toBeNull();
			expect(catalog.findArticle("catalog/en/article-moved", [])).not.toBeNull();
		});

		const doTest = async (useInner: boolean, from: string, to: string) => {
			const { wm, fp, makeResourceUpdater } = await makeApp();

			const catalog = await wm.getContextlessCatalog("catalog");

			const item = catalog.findArticle(`catalog/${from}`, []);
			expect(item).not.toBeNull();
			const itemEn = catalog.findArticle(`catalog/en/${from}`, []);
			expect(itemEn).not.toBeNull();

			await catalog.moveItem(
				useInner ? itemEn.ref : item.ref,
				fp.getItemRef(item.ref.path.getNewName(to)),
				makeResourceUpdater,
			);
			await catalog.update();

			expect(catalog.findArticle(`catalog/${from}`, [])).toBeNull();
			expect(catalog.findArticle(`catalog/en/${from}`, [])).toBeNull();

			const renamedItemInner = catalog.findArticle(`catalog/en/${to}`, []);
			expect(renamedItemInner).not.toBeNull();
			expect(renamedItemInner.ref.path.value).toEqual(`catalog/en/${to}.md`);
			expect(await fp.exists(renamedItemInner.ref.path)).toBeTruthy();

			const renamedItem = catalog.findArticle(`catalog/${to}`, []);
			expect(renamedItem).not.toBeNull();
			expect(renamedItem.ref.path.value).toEqual(`catalog/${to}.md`);
			expect(await fp.exists(renamedItem.ref.path)).toBeTruthy();
		};

		test("в основном каталоге", () => doTest(false, "article", "article-moved"));
		test("в дочернем каталоге", () => doTest(true, "article", "article-moved"));
	});

	test("сразу пересортировывает родителя языковой пары после изменения order", async () => {
		const { wm } = await makeApp();
		const catalog = await wm.getContextlessCatalog("catalog");
		const ruRoot = resolveRootCategory(catalog, catalog.props, ContentLanguage.ru);
		const enRoot = resolveRootCategory(catalog, catalog.props, ContentLanguage.en);
		const ruArticle = catalog.findArticle("catalog/article", []);
		const ruTest = catalog.findArticle("catalog/test", []);
		const enArticle = catalog.findArticle("catalog/en/article", []);
		const enTest = catalog.findArticle("catalog/en/test", []);

		await ruArticle.setOrder(1, true);
		await ruTest.setOrder(2, true);
		await enArticle.setOrder(1, true);
		await enTest.setOrder(2, true);
		await ruRoot.sortItems("no-sort");
		await enRoot.sortItems("no-sort");

		await ruTest.setOrderAfter(ruRoot);
		await ruRoot.sortItems("no-sort");

		expect(ruRoot.items.indexOf(ruTest)).toBeLessThan(ruRoot.items.indexOf(ruArticle));
		expect(enRoot.items.indexOf(enTest)).toBeLessThan(enRoot.items.indexOf(enArticle));
	});

	describe("перемещает категории в основном и дочернем каталогах", () => {
		const doTest = async (useInner: boolean) => {
			const { wm, fp, makeResourceUpdater } = await makeApp();

			const catalog = await wm.getContextlessCatalog("catalog");

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
			);
			await catalog.update();

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

			const catalog = await wm.getContextlessCatalog("catalog");
			const articleParser = new ArticleParser(
				await app.contextFactory.fromWeb({
					language: null,
				}),
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

			const catalog = await wm.getContextlessCatalog("catalog");
			const parent = useInner
				? catalog.findArticle("catalog/en/article", [])?.ref
				: catalog.findArticle("catalog/article", [])?.ref;

			expect(parent).not.toBeNull();

			await catalog.createArticle(makeResourceUpdater, "", parent);

			const category = catalog.findArticle("catalog/article", [])?.type;
			expect(category).toEqual(ItemType.category);
			expect(await fp.exists(p("catalog/article/_index.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/article/untitled.md"))).toBeTruthy();

			const categoryInner = catalog.findArticle("catalog/en/article", [])?.type;
			expect(categoryInner).toEqual(ItemType.category);
			expect(await fp.exists(p("catalog/en/article/_index.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/en/article/untitled.md"))).toBeTruthy();
		};

		test("в основном каталоге", () => doTest(false));
		test("в дочернем каталоге", () => doTest(true));
	});

	describe("создает отсутствующую статью при изменении пропсов", () => {
		test("создает статью на английском при её отсутствии", async () => {
			const { wm, fp, makeResourceUpdater } = await makeApp();

			await fp.delete(p("catalog/en/test.md"));
			await fp.write(p("catalog/en/article.md"), "en");

			const catalog = await wm.getContextlessCatalog("catalog");

			const ruArticle = catalog.findArticle("catalog/test", []);
			expect(ruArticle).not.toBeNull();
			expect(await fp.exists(p("catalog/test.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/en/test.md"))).toBeFalsy();

			await catalog.updateItemProps(
				{
					logicPath: "catalog/test",
					order: 1,
					description: "123",
				},
				makeResourceUpdater,
			);

			const enArticle = catalog.findArticle("catalog/en/test", []);
			expect(enArticle).not.toBeNull();
			expect(await fp.exists(p("catalog/en/test.md"))).toBeTruthy();

			expect(await enArticle.getContent()).toBe("");

			const otherArticle = catalog.findArticle("catalog/en/article", []);
			expect(otherArticle).not.toBeNull();
			expect(await otherArticle.getContent()).toBe("en");
		});

		test("creates missing default-language article when localized root article props change", async () => {
			const { wm, fp, makeResourceUpdater } = await makeApp();
			await fp.delete(p("catalog/untitled.md"));
			await fp.delete(p("catalog/en/untitled.md"));

			const catalog = await wm.getContextlessCatalog("catalog");
			const enRoot = resolveRootCategory(catalog, catalog.props, ContentLanguage.en);
			const enArticle = await catalog.createArticle(makeResourceUpdater, "", enRoot.ref);

			expect(enArticle.logicPath).toBe("catalog/en/untitled");
			expect(await fp.exists(p("catalog/en/untitled.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog/untitled.md"))).toBeTruthy();

			await catalog.updateItemProps(
				{
					logicPath: enArticle.logicPath,
					order: 1,
					description: "created in English",
				},
				makeResourceUpdater,
			);

			expect(await fp.exists(p("catalog/untitled.md"))).toBeTruthy();
		});
	});

	describe("works with catalogs that have docroot", () => {
		beforeEach(async () => {
			await dfp.write(
				p("catalog-with-docroot/docs/.doc-root.yaml"),
				`language: ru
supportedLanguages:
  - ru
  - en
docroot: docs`,
			);

			await dfp.write(p("catalog-with-docroot/docs/article.md"), "ru content");
			await dfp.write(p("catalog-with-docroot/docs/en/_index.md"), "");
			await dfp.write(p("catalog-with-docroot/docs/en/article.md"), "en content");
		});

		test("updates article properties in all languages with docroot", async () => {
			const { wm, makeResourceUpdater, fp } = await makeApp();
			const catalog = await wm.getContextlessCatalog("catalog-with-docroot");

			expect(await fp.exists(p("catalog-with-docroot/docs/article.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog-with-docroot/docs/en/article.md"))).toBeTruthy();

			const ruArticle = catalog.findItemByItemPath(new Path("catalog-with-docroot/docs/article.md"));
			const enArticle = catalog.findItemByItemPath(new Path("catalog-with-docroot/docs/en/article.md"));
			expect(ruArticle).not.toBeNull();
			expect(enArticle).not.toBeNull();

			await catalog.updateItemProps(
				{
					logicPath: ruArticle.logicPath,
					order: 5,
					description: "New description",
				},
				makeResourceUpdater,
			);

			await catalog.update();

			const updatedRuArticle = catalog.findItemByItemPath(new Path("catalog-with-docroot/docs/article.md"));
			const updatedEnArticle = catalog.findItemByItemPath(new Path("catalog-with-docroot/docs/en/article.md"));

			expect(updatedRuArticle).not.toBeNull();
			expect(updatedEnArticle).not.toBeNull();

			expect(await fp.exists(p("catalog-with-docroot/docs/article.md"))).toBeTruthy();
			expect(await fp.exists(p("catalog-with-docroot/docs/en/article.md"))).toBeTruthy();
		});
	});

	// A partially translated catalog is the normal state: `catalog/category/q.md`
	// has no `catalog/en/category/q.md` counterpart. Moving it must not crash —
	// onItemMoved mirrors the move into every other language and used to call
	// catalog.moveItem() on a ref that simply isn't there, tripping the
	// `Item '...' wasn't found in catalog` assert inside moveItem.
	describe("перемещает статью, у которой нет пары в другом языке", () => {
		const doTest = async (from: string, to: string) => {
			const { wm, fp, makeResourceUpdater } = await makeApp();
			const catalog = await wm.getContextlessCatalog("catalog");

			const item = catalog.findItemByItemPath(p(from));
			expect(item).not.toBeNull();

			await catalog.moveItem(item.ref, fp.getItemRef(p(to)), makeResourceUpdater);
			await catalog.update();

			expect(await fp.exists(p(from))).toBeFalsy();
			expect(await fp.exists(p(to))).toBeTruthy();
			expect(catalog.findItemByItemPath(p(to))).not.toBeNull();
		};

		test("вытаскивает статью из раздела в корень", () => doTest("catalog/category/q.md", "catalog/q.md"));

		test("вытаскивает статью из раздела в корень на втором языке", async () => {
			await dfp.write(p("catalog/en/category/only-en.md"), "en");
			await doTest("catalog/en/category/only-en.md", "catalog/en/only-en.md");
		});
	});
});
