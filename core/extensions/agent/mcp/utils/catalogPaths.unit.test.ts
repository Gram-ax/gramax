import Path from "@core/FileProvider/Path/Path";
import { buildCatalogItemLookup, buildPath, normalizePath } from "./catalogPaths";

describe("catalogPaths utils", () => {
	test("normalizePath trims, removes leading slashes and normalizes separators", () => {
		expect(normalizePath("  /docs\\section\\a.md  ")).toBe("docs/section/a.md");
	});

	test("normalizePath handles empty and slash-only values", () => {
		expect(normalizePath("")).toBe("");
		expect(normalizePath("   ")).toBe("");
		expect(normalizePath("/")).toBe("");
		expect(normalizePath("\\")).toBe("");
		expect(normalizePath("///\\\\")).toBe("");
	});

	test("normalizePath keeps internal duplicate slashes as-is", () => {
		expect(normalizePath("docs//section///a.md")).toBe("docs//section///a.md");
	});

	test("buildPath concatenates normalized catalog and item paths", () => {
		expect(buildPath("/docs", "\\section\\a.md")).toBe("docs/section/a.md");
	});

	test("buildPath handles empty catalog and item combinations", () => {
		expect(buildPath("", "")).toBe("/");
		expect(buildPath("docs", "")).toBe("docs/");
		expect(buildPath("", "section/a.md")).toBe("/section/a.md");
	});

	test("buildCatalogItemLookup returns normalized values and full Path", () => {
		const lookup = buildCatalogItemLookup(" /docs ", " \\section\\a.md ");

		expect(lookup.catalogName).toBe("docs");
		expect(lookup.itemPath).toBe("section/a.md");
		expect(lookup.fullPath).toEqual(new Path("docs/section/a.md"));
		expect(lookup.fullPath.value).toBe("docs/section/a.md");
	});

	test("buildCatalogItemLookup handles nested and mixed separator paths", () => {
		const lookup = buildCatalogItemLookup("\\team/docs\\", "guides\\api\\_index.md");

		expect(lookup.catalogName).toBe("team/docs/");
		expect(lookup.itemPath).toBe("guides/api/_index.md");
		expect(lookup.fullPath.value).toBe("team/docs//guides/api/_index.md");
	});
});
