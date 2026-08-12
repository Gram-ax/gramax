import MountFileProvider from "@core/FileProvider/MountFileProvider/MountFileProvider";
import Path from "@core/FileProvider/Path/Path";
import type { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure, { type CatalogTreeDto } from "@core/FileStructue/FileStructure";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { resolve } from "path";

const path = (p: string) => new Path(p);

describe("FileStructure", () => {
	const fp = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs")));
	const fs = new FileStructure(fp, false);

	beforeAll(async () => {
		await fp.write(path("_1/2/3/4/5/6/doc-root.yaml"), "");

		await fp.write(path("1/2/3/4/5/doc-root.yaml"), "");
		await fp.write(path("1/2/3/4/5/article.md"), "");

		await fp.write(path("3/catalog3/doc-root.yaml"), "");
		await fp.write(path("3/x/doc-root.yaml"), "");

		await fp.write(path("catalog1/doc-root.yaml"), "");
		await fp.write(path("catalog1/article2.md"), "");
		await fp.write(path("catalog1/1.article3.md"), "");
		await fp.write(path("catalog1/1. article4.md"), "");
		await fp.write(path("catalog1/test_article.md"), "");

		await fp.write(path("catalog1/category1/_index.md"), "");
		await fp.write(path("catalog1/category1/article1.md"), "");
		await fp.write(path("catalog1/category 1/_index.md"), "");
		await fp.write(path("catalog1/category 1/article 1.md"), "");

		await fp.write(path("catalog2/doc-root.yaml"), "");
	});

	afterAll(async () => {
		await fp.delete(Path.empty);
	});

	describe("находит", () => {
		test("каталоги (они есть)", async () => {
			const catalogs = await fs.getCatalogEntries();
			expect(catalogs).toHaveLength(5);
			const paths = catalogs.map((c) => c.getRootCategoryDirectoryPath().value);
			expect(paths).toEqual(["1/2/3/4/5", "3/catalog3", "_1", "catalog1", "catalog2"]);
		});

		test("каталоги (их нет)", async () => {
			const fp = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs", "empty")));
			const fs = new FileStructure(fp, false);
			const catalogs = await fs.getCatalogEntries();
			expect(catalogs).toHaveLength(0);
		});

		test("статьи", async () => {
			const catalogs: Catalog[] = [];
			for (const entry of await fs.getCatalogEntries()) catalogs.push(await entry.load());

			const articles = catalogs
				.map((c) => c.getItems())
				.map((c) => c.map((a) => a.getFileName()))
				.map((c) => c.sort());

			expect(articles).toEqual([
				["article"],
				[],
				[],
				[
					"1. article4",
					"1.article3",
					"article 1",
					"article1",
					"article2",
					"category 1",
					"category1",
					"test_article",
				],
				[],
			]);
		});
	});

	describe("формирует правильные logicPath у", () => {
		test("разделов", async () => {
			const catalogs: Catalog[] = [];
			for (const entry of await fs.getCatalogEntries()) catalogs.push(await entry.load());

			const articles = catalogs
				.map((c) => c.getCategories())
				.map((c) => c.map((a) => a.logicPath))
				.map((c) => c.sort());

			expect(articles).toEqual([
				["1"],
				["3"],
				["_1"],
				["catalog1", "catalog1/category 1", "catalog1/category1"],
				["catalog2"],
			]);
		});

		test("статей", async () => {
			const catalogs: Catalog[] = [];
			for (const entry of await fs.getCatalogEntries()) catalogs.push(await entry.load());

			const articles = catalogs
				.map((c) => c.getItems())
				.map((c) => c.map((a) => a.logicPath))
				.map((c) => c.sort());

			expect(articles).toEqual([
				["1/article"],
				[],
				[],
				[
					"catalog1/1. article4",
					"catalog1/1.article3",
					"catalog1/article2",
					"catalog1/category 1",
					"catalog1/category 1/article 1",
					"catalog1/category1",
					"catalog1/category1/article1",
					"catalog1/test_article",
				],
				[],
			]);
		});
	});

	describe("создаёт", () => {
		test("каталог", async () => {
			await fs.createCatalog({ title: "test1", url: "test1" });
			const entries = await fs.getCatalogEntries();
			const entry = entries.find((x) => x.name === "test1");
			expect(entry).toBeDefined();
			const catalog = await entry.load();
			expect(catalog).toBeDefined();
			expect(fp.exists(path("test1/doc-root.yaml"))).toBeTruthy();
			expect(catalog.getItems()).toHaveLength(0);
		});

		test("статью", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			const article = await catalog.createArticle(null, "");
			expect(article.getFileName()).toEqual("untitled");
			expect(fp.exists(path("test1/untitled.md")));
		});

		test("категорию", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			await fs.createCategory(
				FileStructure.getCatalogPath(catalog).join(path("category/_index.md")),
				catalog.getRootCategory(),
				// biome-ignore lint/suspicious/noExplicitAny: createCategory only uses these fields, so it's ok
				{ props: {}, content: "content" } as any,
				catalog,
			);

			const actual = await fp.read(path("test1/category/_index.md"));
			expect(actual).not.toBeNull();
			expect(actual).toContain("content");
		});

		test("callback для фильтрации", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			expect(catalog.getItems([() => false])).toHaveLength(0);
		});
	});

	describe("читает", () => {
		test("категорию", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			const category = await fs.makeCategory(
				path("test1/category"),
				catalog.getRootCategory(),
				catalog,
				path("test1/category/_index.md"),
			);
			expect(category).toBeDefined();
			expect(category.type).toEqual(ItemType.category);
		});
	});

	describe("сохраняет", () => {
		test("каталог с изменёнными пропсами", async () => {
			const entry = await fs.getCatalogEntryByPath(path("catalog1"));
			const catalog = await entry.load();
			catalog.props.title = "test";
			await fs.saveCatalog(catalog);
			const entry2 = await fs.getCatalogEntryByPath(path("catalog1"));
			expect(entry2.props.title).toEqual("test");
		});
	});

	describe("обрабатывает ошибки", () => {
		test("чтения несуществующего каталога", async () => {
			const catalog = await fs.getCatalogEntryByPath(path("not-exists111"));
			expect(catalog).toBeUndefined();
		});

		// test("чтения несуществующей категории (путь не существует)", async () => {
		// 	const category = await fs.readCategory(fp, path("not-exists"), undefined, {}, {}, path("not-exists-too"));
		// 	expect(category).toBeUndefined();
		// });

		// test("чтения несуществующей категории (categoryIndexFilePath = undefined)", async () => {
		// 	const catalog = await fs.getCatalogByPath(path("test1"));
		// 	const category = await fs.readCategory(
		// 		fp,
		// 		path("test1/category"),
		// 		catalog.getRootCategory(),
		// 		{},
		// 		{},
		// 		undefined,
		// 	);
		// 	expect(category).toBeNull();
		// });
	});

	describe("определяет", () => {
		test("каталог ли это", () => {
			expect(FileStructure.isCatalog(path("test1/doc-root.yaml"))).toBeTruthy();
			expect(FileStructure.isCatalog(path("not-a-catalog"))).toBeFalsy();
		});

		test("путь до каталога", async () => {
			const catalog = await fs.getCatalogByPath(path("catalog1"));
			expect(FileStructure.getCatalogPath(catalog).value).toEqual("catalog1");
		});

		test("имя каталога", async () => {
			const catalog = await fs.getCatalogEntryByPath(path("catalog1"));
			expect(catalog.name).toEqual("catalog1");
		});

		test("имя вложенного каталога", async () => {
			const catalog = await fs.getCatalogEntryByPath(path("3"));
			expect(catalog.name).toEqual("3");
		});

		test("basePath", async () => {
			const entry = await fs.getCatalogEntryByPath(path("3"));
			const catalog = await entry.load();
			expect(catalog.basePath.value).toEqual("3");
		});
	});

	describe("preserves frontmatter types (parity with Rust scan)", () => {
		const fpTypes = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs-types")));
		const fsTypes = new FileStructure(fpTypes, false);

		beforeAll(async () => {
			await fpTypes.write(path("c/doc-root.yaml"), "");
			await fpTypes.write(
				path("c/article.md"),
				`---\norder: 3\ntitle: A\nweight: 0.5\nexternal: true\nhidden: false\nicon:\nslug: "42"\ntags:\n  - one\n  - 2\n---\nbody`,
			);
			await fpTypes.write(path("c/sub/_index.md"), `---\norder: 1\ntitle: Sub\n---\n`);
			await fpTypes.write(path("c/sub/a.md"), `---\norder: 0.5\ntitle: A\n---\n`);
		});

		afterAll(async () => {
			await fpTypes.delete(Path.empty);
		});

		test("integer order is a number", async () => {
			const catalog = await fsTypes.getCatalogByPath(path("c"));
			const article = catalog.findArticle("c/article", []);
			expect(typeof article.props.order).toBe("number");
			expect(article.props.order).toBe(3);
		});

		test("fractional order preserves float", async () => {
			const catalog = await fsTypes.getCatalogByPath(path("c"));
			const article = catalog.findArticle("c/article", []);
			expect((article.props as Record<string, unknown>).weight).toBe(0.5);
		});

		test("booleans stay booleans", async () => {
			const catalog = await fsTypes.getCatalogByPath(path("c"));
			const article = catalog.findArticle("c/article", []);
			expect(article.props.external).toBe(true);
			expect((article.props as Record<string, unknown>).hidden).toBe(false);
		});

		test("null stays null", async () => {
			const catalog = await fsTypes.getCatalogByPath(path("c"));
			const article = catalog.findArticle("c/article", []);
			expect((article.props as Record<string, unknown>).icon).toBeNull();
		});

		test("quoted numeric stays string", async () => {
			const catalog = await fsTypes.getCatalogByPath(path("c"));
			const article = catalog.findArticle("c/article", []);
			const props = article.props as Record<string, unknown>;
			expect(typeof props.slug).toBe("string");
			expect(props.slug).toBe("42");
		});

		test("category index frontmatter order parsed as number", async () => {
			const catalog = await fsTypes.getCatalogByPath(path("c"));
			const sub = catalog.getCategories().find((c) => c.logicPath === "c/sub");
			expect(sub).toBeDefined();
			expect(typeof sub.props.order).toBe("number");
			expect(sub.props.order).toBe(1);
		});
	});

	describe("orders serialized frontmatter as title, description, order, ...rest", () => {
		const fpOrder = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs-order")));
		const fsOrder = new FileStructure(fpOrder, false);

		const frontmatterKeys = (raw: string) => {
			const keys: string[] = [];
			const lines = raw.split("\n");
			// skip the opening `---`, collect each top-level `key:` line until the closing `---`
			for (let i = 1; i < lines.length; i++) {
				if (lines[i] === "---") break;
				const m = lines[i].match(/^([a-zA-Z_][\w-]*):/);
				if (m) keys.push(m[1]);
			}
			return keys;
		};

		beforeAll(async () => {
			await fpOrder.write(path("c/doc-root.yaml"), "");
			// article created without an `order` key yet (fresh article before it is placed in nav)
			await fpOrder.write(path("c/a.md"), `---\ntitle: My Title\ndescription: Desc\n---\nbody`);
		});

		afterAll(async () => {
			await fpOrder.delete(Path.empty);
		});

		test("serialize() leads with title, description, order in that order", () => {
			// props deliberately supplied out of order: order first, title buried
			const raw = fsOrder.serialize({
				props: { order: 5, tags: ["x"], title: "T", description: "D" } as never,
				content: "body",
			});
			expect(frontmatterKeys(raw)).toEqual(["title", "description", "order", "tags"]);
		});

		test("setOrder keeps title first and writes order as the third key", async () => {
			const catalog = await fsOrder.getCatalogByPath(path("c"));
			const article = catalog.findArticle("c/a", []);
			// `order` is a brand-new key here — JS would append it last; normalization must
			// re-seat it after title/description, not push title off the top.
			await article.setOrder(5);
			const raw = (await fpOrder.read(article.ref.path)).toString();
			expect(article.props.order).toBe(5);
			expect(frontmatterKeys(raw)).toEqual(["title", "description", "order"]);
		});
	});

	describe("heals article/category name collisions", () => {
		const fpc = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs-collision")));
		const fsc = new FileStructure(fpc, false);

		beforeAll(async () => {
			// fold case (js path): category index has frontmatter but no own body
			await fpc.write(path("hc1/doc-root.yaml"), "");
			await fpc.write(path("hc1/foo.md"), "---\ntitle: Foo Article\n---\n\narticle body");
			await fpc.write(path("hc1/foo/_index.md"), "---\ntitle: Foo Category\norder: 1\n---\n\n   \n");
			await fpc.write(path("hc1/foo/child.md"), "child body");

			// rename case (js path): both sides have real content
			await fpc.write(path("hc2/doc-root.yaml"), "");
			await fpc.write(path("hc2/foo.md"), "---\ntitle: A\n---\n\nbody A");
			await fpc.write(path("hc2/foo/_index.md"), "---\ntitle: B\n---\n\nbody B");

			// guard: read-only file structure
			await fpc.write(path("hc3/doc-root.yaml"), "");
			await fpc.write(path("hc3/foo.md"), "body A");
			await fpc.write(path("hc3/foo/_index.md"), "body B");

			// guard: git-tree provider
			await fpc.write(path("hc4/doc-root.yaml"), "");
			await fpc.write(path("hc4/foo.md"), "body A");
			await fpc.write(path("hc4/foo/_index.md"), "body B");

			// fold case (native path): section index carries a title but no description;
			// the article's description must fill that gap while the section's title wins
			await fpc.write(path("hn1/doc-root.yaml"), "");
			await fpc.write(
				path("hn1/foo.md"),
				"---\ntitle: Foo Article\ndescription: Article desc\n---\n\narticle body",
			);
			await fpc.write(path("hn1/foo/_index.md"), "---\ntitle: Foo Category\n---\n");
			await fpc.write(path("hn1/foo/child.md"), "child body");

			// rename case (native path)
			await fpc.write(path("hn2/doc-root.yaml"), "");
			await fpc.write(path("hn2/foo.md"), "---\ntitle: A\n---\n\nbody A");
			await fpc.write(path("hn2/foo/_index.md"), "---\ntitle: B\n---\n\nbody B");
		});

		afterAll(async () => {
			await fpc.delete(Path.empty);
		});

		test("folds article into category when index has no own content (js path)", async () => {
			const catalog = await fsc.getCatalogByPath(path("hc1"));

			expect(await fpc.exists(path("hc1/foo.md"))).toBe(false);
			const index = await fpc.read(path("hc1/foo/_index.md"));
			expect(index).toContain("article body");
			// section's own frontmatter survives the fold; article props only fill gaps
			expect(index).toContain("Foo Category");
			expect(index).toContain("order: 1");

			const category = catalog.getCategories().find((c) => c.logicPath === "hc1/foo");
			expect(category).toBeDefined();
			expect(category.props.title).toBe("Foo Category");
			expect(category.props.order).toBe(1);

			expect(catalog.findArticle("hc1/foo/child", [])).toBeDefined();

			const rootItems = catalog.getRootCategory().items.map((i) => i.logicPath);
			expect(rootItems.filter((l) => l === "hc1/foo")).toHaveLength(1);
		});

		test("renames article to a unique name when both sides have content (js path)", async () => {
			const movements: { oldPath: Path; newPath: Path }[] = [];
			const token = fsc.events.on("catalog-collision-healed", ({ movements: m }) => {
				movements.push(...m);
			});

			const catalog = await fsc.getCatalogByPath(path("hc2"));
			fsc.events.off(token);

			expect(await fpc.exists(path("hc2/foo.md"))).toBe(false);
			expect(await fpc.exists(path("hc2/foo-2.md"))).toBe(true);
			expect(await fpc.read(path("hc2/foo-2.md"))).toContain("body A");
			expect(await fpc.read(path("hc2/foo/_index.md"))).toContain("body B");

			const logicPaths = catalog
				.getItems()
				.map((i) => i.logicPath)
				.sort();
			expect(logicPaths).toEqual(["hc2/foo", "hc2/foo-2"]);

			expect(movements).toHaveLength(1);
			expect(movements[0].oldPath.value).toBe("hc2/foo.md");
			expect(movements[0].newPath.value).toBe("hc2/foo-2.md");
		});

		test("does not mutate a read-only catalog", async () => {
			const fsReadOnly = new FileStructure(fpc, true);
			const catalog = await fsReadOnly.getCatalogByPath(path("hc3"));

			expect(await fpc.exists(path("hc3/foo.md"))).toBe(true);
			expect(await fpc.exists(path("hc3/foo/_index.md"))).toBe(true);

			const logicPaths = catalog.getItems().map((i) => i.logicPath);
			expect(logicPaths.filter((l) => l === "hc3/foo")).toHaveLength(2);
		});

		test("does not mutate when the file provider is a git-tree provider", async () => {
			const fpGit = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs-collision")));
			Object.defineProperty(fpGit.default(), "kind", { get: () => "git" });
			const fsGit = new FileStructure(fpGit, false);

			const catalog = await fsGit.getCatalogByPath(path("hc4"));

			expect(await fpc.exists(path("hc4/foo.md"))).toBe(true);
			expect(await fpc.exists(path("hc4/foo/_index.md"))).toBe(true);

			const logicPaths = catalog.getItems().map((i) => i.logicPath);
			expect(logicPaths.filter((l) => l === "hc4/foo")).toHaveLength(2);
		});

		test("folds article into category when index has no own content (native path)", async () => {
			const entry = await fsc.getCatalogEntryByPath(path("hn1"));
			const tree: CatalogTreeDto = {
				docrootRel: "doc-root.yaml",
				catalogProps: {},
				children: [
					{
						kind: "article",
						relPath: "foo.md",
						frontMatter: { title: "Foo Article", description: "Article desc" },
						parseError: null,
					},
					{
						kind: "category",
						relPath: "foo/_index.md",
						directory: "foo",
						hasIndex: true,
						frontMatter: { title: "Foo Category" },
						children: [{ kind: "article", relPath: "foo/child.md", frontMatter: {}, parseError: null }],
					},
				],
			};

			// biome-ignore lint/complexity/useLiteralKeys: bracket access bypasses TS private visibility on purpose
			const catalog: Catalog = await fsc["_hydrateCatalogFromTree"](entry, tree);

			expect(await fpc.exists(path("hn1/foo.md"))).toBe(false);
			const index = await fpc.read(path("hn1/foo/_index.md"));
			expect(index).toContain("article body");

			const category = catalog.getCategories().find((c) => c.logicPath === "hn1/foo");
			expect(category).toBeDefined();
			// section's title wins; article's description fills the gap the section left
			expect(category.props.title).toBe("Foo Category");
			expect(category.props.description).toBe("Article desc");
			expect(catalog.findArticle("hn1/foo/child", [])).toBeDefined();

			const rootItems = catalog.getRootCategory().items.map((i) => i.logicPath);
			expect(rootItems.filter((l) => l === "hn1/foo")).toHaveLength(1);
		});

		test("renames article to a unique name when both sides have content (native path)", async () => {
			const entry = await fsc.getCatalogEntryByPath(path("hn2"));
			const tree: CatalogTreeDto = {
				docrootRel: "doc-root.yaml",
				catalogProps: {},
				children: [
					{ kind: "article", relPath: "foo.md", frontMatter: { title: "A" }, parseError: null },
					{
						kind: "category",
						relPath: "foo/_index.md",
						directory: "foo",
						hasIndex: true,
						frontMatter: { title: "B" },
						children: [],
					},
				],
			};

			// biome-ignore lint/complexity/useLiteralKeys: bracket access bypasses TS private visibility on purpose
			const catalog: Catalog = await fsc["_hydrateCatalogFromTree"](entry, tree);

			expect(await fpc.exists(path("hn2/foo.md"))).toBe(false);
			expect(await fpc.exists(path("hn2/foo-2.md"))).toBe(true);
			expect(await fpc.read(path("hn2/foo-2.md"))).toContain("body A");
			expect(await fpc.read(path("hn2/foo/_index.md"))).toContain("body B");

			const logicPaths = catalog
				.getItems()
				.map((i) => i.logicPath)
				.sort();
			expect(logicPaths).toEqual(["hn2/foo", "hn2/foo-2"]);
		});
	});

	describe("filters nested workspaces", () => {
		const fpNested = MountFileProvider.fromDefault(new Path(resolve(__dirname, "catalogs-nested-ws")));

		beforeAll(async () => {
			await fpNested.write(path("catalog-ok/doc-root.yaml"), "");
			await fpNested.write(path("nested-ws-direct/workspace.yaml"), "");
			await fpNested.write(path("projects/readme.md"), "");
		});

		afterAll(async () => {
			await fpNested.delete(Path.empty);
		});

		test("excludes dir with workspace.yaml (direct nesting)", async () => {
			const fsNested = new FileStructure(fpNested, false);
			const entries = await fsNested.getCatalogEntries();
			const names = entries.map((e) => e.name);
			expect(names).not.toContain("nested-ws-direct");
			expect(names).toContain("catalog-ok");
		});

		test("excludes dir containing a registered workspace (indirect nesting)", async () => {
			const knownWsPath = resolve(fpNested.rootPath.value, "projects", "workspace-b");
			const fsNested = new FileStructure(fpNested, false, [knownWsPath]);
			const entries = await fsNested.getCatalogEntries();
			const names = entries.map((e) => e.name);
			expect(names).not.toContain("projects");
			expect(names).toContain("catalog-ok");
		});
	});
});
