import getApp from "@app/node/app";
import type Application from "@app/types/Application";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import ArticleParser from "@core/FileStructue/Article/ArticleParser";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FSCollisionHealEvents from "@core/FileStructue/events/FSCollisionHealEvents";
import FileStructure from "@core/FileStructue/FileStructure";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import type { Workspace } from "@ext/workspace/Workspace";
import { resolve } from "path";

let app: Application;
let fp: FileProvider;
let workspace: Workspace;

const p = (s: string) => new Path(s);

const getMakeResourceUpdater = async () => {
	const ctx = await app.contextFactory.fromWeb({
		language: "ru",
	});
	return (catalog: Catalog) => new ResourceUpdater(ctx, catalog, app.parser, app.parserContextFactory, app.formatter);
};

describe("Каталог", () => {
	beforeAll(async () => {
		process.env.ROOT_PATH = resolve(__dirname, "tests");
		const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

		await dfp.write(p("x/a.md"), "");
		await dfp.write(p("x/b/_index.md"), "");
		await dfp.write(p("x/b/c.md"), "");

		await dfp.write(p("y/x/a.md"), "");
		await dfp.write(p("y/x/b/_index.md"), "");
		await dfp.write(p("y/x/b/c.md"), "");
		await dfp.write(p("y/x/.doc-root.yaml"), "");

		await dfp.write(p("res/a.md"), "");
		await dfp.write(p("res/b.md"), "![](./pic.png)");
		await dfp.write(p("res/pic.png"), "");

		await dfp.write(p("docroot/docs/a.md"), "");
		await dfp.write(p("docroot/docs/b/_index.md"), "");
		await dfp.write(p("docroot/docs/b/c.md"), "");
		await dfp.write(p("docroot/docs/.doc-root.yaml"), "");

		await dfp.write(p("nc/.doc-root.yaml"), "");
		await dfp.write(p("nc/article-top.md"), "# top\n\n[link](support/inner.md)\n");
		await dfp.write(p("nc/support/_index.md"), "# support\n\nbody [link](inner.md)\n");
		await dfp.write(p("nc/support/inner.md"), "# inner\n\n[link](../article-top.md)\n");
		await dfp.write(p("nc/support/inner2.md"), "# inner2\n\nbody\n");

		await dfp.write(p("col/.doc-root.yaml"), "");
		await dfp.write(p("col/other.md"), "# other\n\n[link](foo.md)\n");
		await dfp.write(p("col/foo.md"), "# foo\n\nbody A\n");
		await dfp.write(p("col/foo/_index.md"), "# foo category\n\nbody B\n");

		await dfp.write(p("colf/.doc-root.yaml"), "");
		await dfp.write(p("colf/sibling.md"), "# sibling\n\nbody\n");
		await dfp.write(p("colf/foo.md"), "# foo\n\n[link](sibling.md)\n");
		await dfp.write(p("colf/foo/_index.md"), "---\ntitle: Foo\n---\n");
		await dfp.write(p("colf/foo/child.md"), "# child\n\nbody\n");

		await dfp.write(p("del/.doc-root.yaml"), "");
		await dfp.write(p("del/ok.md"), "# ok\n\nbody\n");
		// Abbreviation markdown produces an unsupported `html_open` token → parse throws ParseError,
		// i.e. an article whose Markdown structure Gramax "couldn't read" (a broken article).
		await dfp.write(p("del/broken.md"), "*[HTML]: Hyper Text Markup Language\n\nHTML is a good thing\n");

		app = await getApp();
		fp = app.wm.current().getFileProvider();
		workspace = app.wm.current();
	});

	afterAll(async () => {
		await fp.delete(p("."));
		delete global.app;
	});

	test("перемещает внутрь папки", async () => {
		const catalog = await workspace.getContextlessCatalog("x");
		await catalog.updateProps({ docroot: "r", title: "x", url: "x" }, await getMakeResourceUpdater());
		await expect(fp.exists(p("x/r/.doc-root.yaml"))).resolves.toBe(true);
		await expect(fp.exists(p("x/r/b/_index.md"))).resolves.toBe(true);
		await expect(fp.exists(p("x/r/b/c.md"))).resolves.toBe(true);

		await expect(fp.exists(p("x/a.md"))).resolves.toBe(false);
	});

	test("перемещает из папки в другую папку", async () => {
		const catalog = await workspace.getContextlessCatalog("y");
		await catalog.updateProps({ docroot: "z", title: "y", url: "y" }, await getMakeResourceUpdater());

		await expect(fp.exists(p("y/z"))).resolves.toBe(true);

		await expect(fp.exists(p("y/z/b/_index.md"))).resolves.toBe(true);
		await expect(fp.exists(p("y/z/b/c.md"))).resolves.toBe(true);
		await expect(fp.exists(p("y/z/.doc-root.yaml"))).resolves.toBe(true);
		await expect(fp.exists(p("y/z/a.md"))).resolves.toBe(true);

		await expect(fp.exists(p("y/x/a.md"))).resolves.toBe(false);
	});

	test("перемещает с ресурсом", async () => {
		const catalog = await workspace.getContextlessCatalog("res");
		await catalog.updateProps({ docroot: "f", title: "res", url: "res" }, await getMakeResourceUpdater());

		await expect(fp.exists(p("res/f/a.md"))).resolves.toBe(true);
		await expect(fp.exists(p("res/f/b.md"))).resolves.toBe(true);
		await expect(fp.exists(p("res/f/pic.png"))).resolves.toBe(true);

		await expect(fp.exists(p("res/pic.png"))).resolves.toBe(false);
	});

	test("перемещает docroot с вложенной категорией и статьями с контентом", async () => {
		const catalog = await workspace.getContextlessCatalog("nc");
		await catalog.updateProps({ docroot: "wrap", title: "nc", url: "nc" }, await getMakeResourceUpdater());

		await expect(fp.exists(p("nc/wrap/.doc-root.yaml"))).resolves.toBe(true);
		await expect(fp.exists(p("nc/wrap/article-top.md"))).resolves.toBe(true);
		await expect(fp.exists(p("nc/wrap/support/_index.md"))).resolves.toBe(true);
		await expect(fp.exists(p("nc/wrap/support/inner.md"))).resolves.toBe(true);
		await expect(fp.exists(p("nc/wrap/support/inner2.md"))).resolves.toBe(true);

		await expect(fp.exists(p("nc/article-top.md"))).resolves.toBe(false);
		await expect(fp.exists(p("nc/support/_index.md"))).resolves.toBe(false);
	});

	// In jest the executing environment aliases `next`, so the app-wired FileStructure is read-only
	// and (correctly) skips collision healing. Build a writable FileStructure over the same fp with
	// the repoint handler mounted — the same wiring app/node/app.ts and app/web/app.ts produce for
	// writable environments.
	const makeCollisionHealingFs = () => {
		const collisionFs = new FileStructure(workspace.getFileProvider() as MountFileProvider, false);
		new FSCollisionHealEvents(collisionFs, app.resourceUpdaterFactory).mount();
		return collisionFs;
	};

	test("лечит коллизию статья/категория переименованием и перенаправляет входящие ссылки", async () => {
		await makeCollisionHealingFs().getCatalogByPath(p("col"));

		await expect(fp.exists(p("col/foo.md"))).resolves.toBe(false);
		await expect(fp.exists(p("col/foo-2.md"))).resolves.toBe(true);
		expect(await fp.read(p("col/foo-2.md"))).toContain("body A");
		expect(await fp.read(p("col/foo/_index.md"))).toContain("body B");

		const other = await fp.read(p("col/other.md"));
		expect(other).toMatch(/\]\((\.\/)?foo-2(\.md)?\)/);
		expect(other).not.toMatch(/\]\((\.\/)?foo(\.md)?\)/);
	});

	test("лечит коллизию статья/категория схлопыванием и перебазирует ссылки статьи", async () => {
		await makeCollisionHealingFs().getCatalogByPath(p("colf"));

		await expect(fp.exists(p("colf/foo.md"))).resolves.toBe(false);
		const index = await fp.read(p("colf/foo/_index.md"));
		expect(index).toMatch(/\]\((\.\/)?\.\.\/sibling(\.md)?\)/);
		await expect(fp.exists(p("colf/foo/child.md"))).resolves.toBe(true);
	});

	test("возвращает относительный docroot для каталога с .doc-root", async () => {
		const catalog = await workspace.getContextlessCatalog("docroot");

		expect(catalog.getRelativeRootCategoryPath().value).toBe("docs");
	});

	test("удаляет статью с невалидной разметкой (не оставляет файл на диске)", async () => {
		const ctx = await app.contextFactory.fromWeb({ language: "ru" });
		const catalog = await workspace.getContextlessCatalog("del");
		const articleParser = new ArticleParser(ctx, app.parser, app.parserContextFactory);

		await expect(fp.exists(p("del/broken.md"))).resolves.toBe(true);

		// A ParseError on the broken article must not abort the delete: the file has to leave the disk,
		// otherwise it reappears on the next catalog reload (#581).
		await catalog.deleteItem(fp.getItemRef(p("del/broken.md")), articleParser);

		await expect(fp.exists(p("del/broken.md"))).resolves.toBe(false);
		await expect(fp.exists(p("del/ok.md"))).resolves.toBe(true);
	});
});
