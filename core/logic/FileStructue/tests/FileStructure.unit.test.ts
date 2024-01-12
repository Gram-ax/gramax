import DiskFileProvider from "@core/FileProvider/DiskFileProvider/DiskFileProvider";
import Path from "@core/FileProvider/Path/Path";
import { Catalog } from "@core/FileStructue/Catalog/Catalog";
import FileStructure, { NEW_ARTICLE_NAME } from "@core/FileStructue/FileStructure";
import { ItemType } from "@core/FileStructue/Item/Item";
import Language from "@ext/localization/core/model/Language";
import { resolve } from "path";

const path = (p: string) => new Path(p);

describe("FileStructure", () => {
	const fp = new DiskFileProvider(resolve(__dirname, "catalogs"));
	const fs = new FileStructure(fp);

	beforeAll(async () => {
		await fp.write(path("3/4/doc-root.yaml"), "");
		await fp.write(path("3/4/article.md"), "");

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
			expect(catalogs.length).toBe(3);
			const paths = catalogs.map((c) => c.getRootCategoryPath().value);
			expect(paths).toEqual(["3/4", "catalog1", "catalog2"]);
		});

		test("каталоги (их нет)", async () => {
			const fp = new DiskFileProvider(resolve(__dirname, "catalogs", "empty"));
			await fp.mkdir(path("dir1"));
			const fs = new FileStructure(fp);
			const catalogs = await fs.getCatalogEntries();
			expect(catalogs.length).toEqual(0);
		});

		test("статьи", async () => {
			const catalogs: Catalog[] = [];
			for (const entry of await fs.getCatalogEntries()) catalogs.push(await entry.load());

			const articles = catalogs
				.map((c) => c.getArticles())
				.map((c) => c.map((a) => a.getFileName()))
				.map((c) => c.sort());

			expect(articles).toEqual([
				["article"],
				["1. article4", "1.article3", "article 1", "article1", "article2", "test_article"],
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

			expect(articles).toEqual([["3"], ["catalog1", "catalog1/category 1", "catalog1/category1"], ["catalog2"]]);
		});

		test("статей", async () => {
			const catalogs: Catalog[] = [];
			for (const entry of await fs.getCatalogEntries()) catalogs.push(await entry.load());

			const articles = catalogs
				.map((c) => c.getArticles())
				.map((c) => c.map((a) => a.logicPath))
				.map((c) => c.sort());

			expect(articles).toEqual([
				["3/article"],
				[
					"catalog1/1. article4",
					"catalog1/1.article3",
					"catalog1/article2",
					"catalog1/category 1/article 1",
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
			const entry = entries.find((x) => x.getName() == "test1");
			expect(entry).toBeDefined();
			const catalog = await entry.load();
			expect(catalog).toBeDefined();
			expect(fp.exists(path("test1/doc-root.yaml"))).toBeTruthy();
			expect(catalog.getArticles().map((a) => a.getFileName())).toEqual([NEW_ARTICLE_NAME]);
		});

		test("статью", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			const article = await catalog.createArticle(null, "", Language.ru);
			expect(article.getFileName()).toEqual("new_article_0");
			expect(fp.exists(path("test1/new_article_0.md")));
		});

		test("категорию", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			await fs.createCategory(
				FileStructure.getCatalogPath(catalog).join(path("category/_index.md")),
				catalog.getRootCategory(),
				{ props: {}, content: "content" } as any, // createCategory использует только эти поля, поэтому норм
				{},
				{},
			);

			const actual = await fp.read(path("test1/category/_index.md"));
			expect(actual).not.toBeNull();
			expect(actual).toContain("content");
		});

		test("callback для фильтрации", async () => {
			fs.addFilterRule(() => false);
			const catalog = await fs.getCatalogByPath(path("test1"));
			expect(catalog.getItems()).toEqual([]);
		});

		test("callback при сохранении", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			let worked = false;
			fs.addSaveRule((props) => {
				worked = !!props;
				return props;
			});
			await fs.saveCatalog(catalog);
			expect(worked).toBeTruthy();
		});
	});

	describe("читает", () => {
		test("категорию", async () => {
			const catalog = await fs.getCatalogByPath(path("test1"));
			const category = await fs.makeCategory(
				path("test1/category"),
				catalog.getRootCategory(),
				{},
				{},
				path("test1/category/_index.md"),
			);
			expect(category).toBeDefined();
			expect(category.type).toEqual(ItemType.category);
		});
	});

	describe("сохраняет", () => {
		test("каталог с изменёнными пропасами", async () => {
			const entry = await fs.getCatalogEntryByPath(path("catalog1"));
			const catalog = await entry.load();
			catalog["_props"] = { title: "test" };
			await fs.saveCatalog(catalog);
			const entry2 = await fs.getCatalogEntryByPath(path("catalog1"));
			expect(entry2.props.title).toEqual("test");
		});
	});

	describe("обрабатывает ошибки", () => {
		test("чтения несуществующего каталога", async () => {
			const catalog = await fs.getCatalogEntryByPath(path("not-exists"));
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
			expect(catalog.getName()).toEqual("catalog1");
		});

		test("имя вложенного каталога", async () => {
			const catalog = await fs.getCatalogEntryByPath(path("3"));
			expect(catalog.getName()).toEqual("3");
		});

		test("basePath", async () => {
			const entry = await fs.getCatalogEntryByPath(path("3"));
			const catalog = await entry.load();
			expect(catalog.getBasePath().value).toEqual("3");
		});
	});
});
