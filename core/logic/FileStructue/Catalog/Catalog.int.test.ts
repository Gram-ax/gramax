import getApp from "@app/node/app";
import type Application from "@app/types/Application";
import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type FileProvider from "@core/FileProvider/model/FileProvider";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import ResourceUpdater from "@core/Resource/ResourceUpdater";
import type { Workspace } from "@ext/workspace/Workspace";
import { resolve } from "path";

let app: Application;
let fp: FileProvider;
let workspace: Workspace;

const p = (s: string) => new Path(s);
const makeResourceUpdater = (catalog: Catalog) =>
	new ResourceUpdater(
		app.contextFactory.fromBrowser("ru" as any, {}),
		catalog,
		app.parser,
		app.parserContextFactory,
		app.formatter,
	);

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

		app = await getApp();
		fp = app.wm.current().getFileProvider();
		workspace = app.wm.current();
	});

	afterAll(async () => {
		await fp.delete(p("."));
		delete global.app;
	});

	test("перемещает внутрь папки", async () => {
		const catalog = await workspace.getCatalog("x");
		await catalog.updateProps(makeResourceUpdater, app.rp, { docroot: "r", title: "x", url: "x" });
		await expect(fp.exists(p("x/r/.doc-root.yaml"))).resolves.toBe(true);
		await expect(fp.exists(p("x/r/b/_index.md"))).resolves.toBe(true);
		await expect(fp.exists(p("x/r/b/c.md"))).resolves.toBe(true);

		await expect(fp.exists(p("x/a.md"))).resolves.toBe(false);
	});

	test("перемещает из папки в другую папку", async () => {
		const catalog = await workspace.getCatalog("y");
		await catalog.updateProps(makeResourceUpdater, app.rp, { docroot: "z", title: "y", url: "y" });

		await expect(fp.exists(p("y/z"))).resolves.toBe(true);

		await expect(fp.exists(p("y/z/b/_index.md"))).resolves.toBe(true);
		await expect(fp.exists(p("y/z/b/c.md"))).resolves.toBe(true);
		await expect(fp.exists(p("y/z/.doc-root.yaml"))).resolves.toBe(true);
		await expect(fp.exists(p("y/z/a.md"))).resolves.toBe(true);

		await expect(fp.exists(p("y/x/a.md"))).resolves.toBe(false);
	});

	test("перемещает с ресурсом", async () => {
		const catalog = await workspace.getCatalog("res");
		await catalog.updateProps(makeResourceUpdater, app.rp, { docroot: "f", title: "res", url: "res" });

		await expect(fp.exists(p("res/f/a.md"))).resolves.toBe(true);
		await expect(fp.exists(p("res/f/b.md"))).resolves.toBe(true);
		await expect(fp.exists(p("res/f/pic.png"))).resolves.toBe(true);

		await expect(fp.exists(p("res/pic.png"))).resolves.toBe(false);
	});
});
