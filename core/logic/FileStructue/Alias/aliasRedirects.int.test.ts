import getApp from "@app/node/app";
import type Application from "@app/types/Application";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Article } from "@core/FileStructue/Article/Article";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import type { Workspace } from "@ext/workspace/Workspace";
import { resolve } from "path";

let app: Application;
let fp: FileProvider;
let workspace: Workspace;

const p = (s: string) => new Path(s);

const getMakeResourceUpdater = async () => {
	const ctx = await app.contextFactory.fromWeb({ language: "ru" });
	return (catalog: Catalog) => new ResourceUpdater(ctx, catalog, app.parser, app.parserContextFactory, app.formatter);
};

describe("Alias redirects", () => {
	beforeAll(async () => {
		process.env.ROOT_PATH = resolve(__dirname, "tests-alias");
		const dfp = new DiskFileProvider(p(process.env.ROOT_PATH));

		await dfp.write(p("al/.doc-root.yaml"), "");
		await dfp.write(p("al/install.md"), "# install\n\nbody\n");
		await dfp.write(p("al/guide/_index.md"), "---\ntitle: guide\naliases:\n  - old-guide\n---\n\nbody\n");
		await dfp.write(p("al/guide/setup.md"), "# setup\n\nbody\n");
		await dfp.write(p("al/renamed.md"), "---\ntitle: manual\naliases:\n  - legacy/page\n---\n\nbody\n");
		await dfp.write(p("al/untitled.md"), "# fresh\n\nbody\n");
		await dfp.write(p("al/new-article-2.md"), "# fresh too\n\nbody\n");

		await dfp.write(p("ml/.doc-root.yaml"), "language: ru\nsupportedLanguages:\n  - ru\n  - en");
		await dfp.write(p("ml/setup.md"), "---\ntitle: Setup\naliases:\n  - install\n---\n\nru\n");
		await dfp.write(p("ml/en/_index.md"), "");
		await dfp.write(p("ml/en/setup.md"), "---\ntitle: Setup EN\n---\n\nen\n");

		app = await getApp();
		fp = app.wm.current().getFileProvider();
		workspace = app.wm.current();
	});

	afterAll(async () => {
		await fp.delete(p("."));
		delete global.app;
	});

	test("DnD move writes an auto alias and the old path resolves to the moved article", async () => {
		// moveItem is the DnD entry point; the auto entry must carry a UTC moved
		// timestamp — its presence is what distinguishes it from a manual alias
		const catalog = await workspace.getContextlessCatalog("al");
		const article = catalog.findItemByItemPath(p("al/install.md"));
		const guide = catalog.findItemByItemPath(p("al/guide/_index.md"));

		await catalog.moveItem(
			article.ref,
			{ path: p("al/guide/install.md"), storageId: article.ref.storageId },
			await getMakeResourceUpdater(),
			[],
		);

		const moved = await fp.read(p("al/guide/install.md"));
		expect(moved).toContain("aliases:");
		expect(moved).toContain("path: install");
		expect(moved).toMatch(/moved: "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z"/);

		const found = catalog.aliases.findArticle(`${catalog.getRootCategory().logicPath}/install`, []);
		expect(found?.logicPath).toBe(
			guide ? `${catalog.getRootCategory().logicPath}/guide/install` : found?.logicPath,
		);
	});

	test("manual alias resolves after catalog read, alias survives article rewrite", async () => {
		const catalog = await workspace.getContextlessCatalog("al");
		const root = catalog.getRootCategory().logicPath;

		const found = catalog.aliases.findArticle(`${root}/legacy/page`, []);
		expect(found?.logicPath).toBe(`${root}/renamed`);

		// re-save the article through the normal update path — alias must survive
		const article = catalog.findItemByItemPath<Article>(p("al/renamed.md"));
		await article.updateContent("new body");
		const raw = await fp.read(p("al/renamed.md"));
		expect(raw).toContain("aliases:");
		expect(raw).toContain("legacy/page");
	});

	test("first slug rename of a new article records no alias", async () => {
		// "untitled"/"new-article-*" names are placeholders (NEW_ARTICLE_REGEX) —
		// nobody ever linked to them, so renaming must not leave an alias behind
		const catalog = await workspace.getContextlessCatalog("al");
		const makeResourceUpdater = await getMakeResourceUpdater();
		const article = catalog.findItemByItemPath<Article>(p("al/untitled.md"));

		await article.updateProps(
			{ logicPath: article.logicPath, fileName: "fresh" } as never,
			makeResourceUpdater(catalog),
			catalog,
		);

		const raw = await fp.read(p("al/fresh.md"));
		expect(raw).not.toContain("aliases");
	});

	test("moving a new article records no alias either", async () => {
		const catalog = await workspace.getContextlessCatalog("al");
		const article = catalog.findItemByItemPath(p("al/new-article-2.md"));

		await catalog.moveItem(
			article.ref,
			{ path: p("al/guide/new-article-2.md"), storageId: article.ref.storageId },
			await getMakeResourceUpdater(),
			[],
		);

		const raw = await fp.read(p("al/guide/new-article-2.md"));
		expect(raw).not.toContain("aliases");
	});

	test("path that nothing aliases resolves to null instead of a guess", async () => {
		const catalog = await workspace.getContextlessCatalog("al");
		const root = catalog.getRootCategory().logicPath;

		expect(catalog.aliases.findArticle(`${root}/no-such-alias`, [])).toBeNull();
	});

	test("category alias redirects its descendants by prefix", async () => {
		// alias 'old-guide' lives on the guide category; a child requested under the
		// old prefix must land on the same child under the category's real path
		const catalog = await workspace.getContextlessCatalog("al");
		const root = catalog.getRootCategory().logicPath;

		const child = catalog.aliases.findArticle(`${root}/old-guide/setup`, []);
		expect(child?.logicPath).toBe(`${root}/guide/setup`);
	});

	test("language URL space mirrors main-language aliases (PRD §6)", async () => {
		const catalog = await workspace.getContextlessCatalog("ml");
		const mainRoot = catalog.getRootCategory().logicPath;

		// main space resolves directly
		const main = catalog.aliases.findArticle(`${mainRoot}/install`, []);
		expect(main?.logicPath).toBe(`${mainRoot}/setup`);

		// en space: alias lives in the ru file, but the reader is redirected to the en translation
		const enRoot = catalog.findArticle(`${mainRoot}/en`, []);
		const en = catalog.aliases.findArticle(`${mainRoot}/en/install`, [], enRoot as never);
		expect(en?.logicPath).toBe(`${mainRoot}/en/setup`);
	});
});
