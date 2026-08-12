import Path from "@core/FileProvider/Path/Path";
import { ItemType } from "@core/FileStructue/Item/ItemType";
import { CatalogItemLookup } from "./catalogPaths";

describe("catalogPaths utils", () => {
	test("normalizePath trims, removes leading slashes and normalizes separators", () => {
		expect(new CatalogItemLookup("", "  /docs\\section\\a.md  ").itemPath).toBe("docs/section/a.md");
	});

	test("normalizePath handles empty and slash-only values", () => {
		expect(new CatalogItemLookup("", "").itemPath).toBe("");
		expect(new CatalogItemLookup("", "   ").itemPath).toBe("");
		expect(new CatalogItemLookup("", "/").itemPath).toBe("");
		expect(new CatalogItemLookup("", "\\").itemPath).toBe("");
		expect(new CatalogItemLookup("", "///\\\\").itemPath).toBe("");
	});

	test("normalizePath keeps internal duplicate slashes as-is", () => {
		expect(new CatalogItemLookup("", "docs//section///a.md").itemPath).toBe("docs//section///a.md");
	});

	test("buildPath concatenates normalized catalog and item paths", () => {
		expect(new CatalogItemLookup("/docs", "\\section\\a.md").asPath()).toEqual(new Path("docs/section/a.md"));
	});

	test("buildPath handles empty catalog and item combinations", () => {
		expect(new CatalogItemLookup("", "").asPath()).toEqual(new Path("/"));
		expect(new CatalogItemLookup("docs", "").asPath()).toEqual(new Path("docs/"));
		expect(new CatalogItemLookup("", "section/a.md").asPath()).toEqual(new Path("/section/a.md"));
	});

	test("buildCatalogItemLookup returns normalized values and full Path", () => {
		const lookup = new CatalogItemLookup(" /docs ", " \\section\\a.md ");

		expect(lookup.catalogName).toBe("docs");
		expect(lookup.itemPath).toBe("section/a.md");
		expect(lookup.asPath()).toEqual(new Path("docs/section/a.md"));
	});

	test("buildCatalogItemLookup handles nested and mixed separator paths", () => {
		const lookup = new CatalogItemLookup("\\team/docs\\", "guides\\api\\_index.md");

		expect(lookup.catalogName).toBe("team/docs/");
		expect(lookup.itemPath).toBe("guides/api/_index.md");
		expect(lookup.asPath()).toEqual(new Path("team/docs//guides/api/_index.md"));
	});

	test("getTypeFromPath resolves article and category suffixes", () => {
		expect(CatalogItemLookup.getTypeFromPath("section/a.md")).toBe(ItemType.article);
		expect(CatalogItemLookup.getTypeFromPath("section/_index.md")).toBe(ItemType.category);
		expect(CatalogItemLookup.getTypeFromPath("section/readme")).toBeNull();
	});

	test("fromCatalogItem builds lookup with editor pathname link", async () => {
		const getPathname = jest.fn().mockResolvedValue("source/-/repo/branch/docs/section/a.md");
		const catalog = {
			name: "docs",
			getRepositoryRelativePath: () => new Path("section/a.md"),
			getPathname,
		} as never;
		const item = {
			ref: { path: new Path("docs/section/a.md") },
			getTitle: () => "Article A",
		} as never;

		const lookup = await CatalogItemLookup.fromCatalogItem(catalog, item);

		expect(getPathname).toHaveBeenCalledWith(item);
		expect(lookup).toMatchObject({
			catalogName: "docs",
			itemPath: "section/a.md",
			title: "Article A",
			link: "source/-/repo/branch/docs/section/a.md",
		});
		expect(lookup.asJSON()).toEqual({
			catalogName: "docs",
			itemPath: "section/a.md",
			title: "Article A",
			link: "source/-/repo/branch/docs/section/a.md",
		});
	});
});
