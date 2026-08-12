import Path from "@core/FileProvider/Path/Path";
import { compactSearchResults } from "./searchResults";

const defaultApp = {
	wm: {
		current: () => ({
			getCatalog: async () => ({
				findItemByItemPath: () => undefined,
			}),
		}),
	},
} as never;

const appWithItem = (catalogName: string, itemPath: string, title: string, editorLink: string) =>
	({
		wm: {
			current: () => ({
				getCatalog: async (name: string) => ({
					name,
					findItemByItemPath: () => ({
						ref: { path: new Path(`${catalogName}/${itemPath}`) },
						getTitle: () => title,
					}),
					getRepositoryRelativePath: () => new Path(itemPath),
					getPathname: async () => editorLink,
				}),
			}),
		},
	}) as never;

const ctx = {} as never;

const articleHit = (refPath: string, items: unknown[]) => ({
	refPath,
	catalog: { name: "docs" },
	items,
});

describe("compactSearchResults", () => {
	test("returns empty array for non-array input", async () => {
		await expect(compactSearchResults(defaultApp, ctx, null, 5, 2)).resolves.toEqual([]);
	});

	test("returns empty array for empty input", async () => {
		await expect(compactSearchResults(defaultApp, ctx, [], 5, 2)).resolves.toEqual([]);
	});

	test("parses refPath into catalogName and itemPath", async () => {
		const raw = [articleHit("docs/section/a.md", [{ searchText: "match one" }])];

		await expect(compactSearchResults(defaultApp, ctx, raw, 5, 2)).resolves.toEqual([
			{ catalogName: "docs", itemPath: "section/a.md", title: "", link: "", snippets: ["match one"] },
		]);
	});

	test("resolves title and link from catalog item", async () => {
		const raw = [articleHit("docs/section/a.md", [{ searchText: "match one" }])];
		const app = appWithItem("docs", "section/a.md", "Article A", "source/-/repo/branch/docs/section/a.md");

		await expect(compactSearchResults(app, ctx, raw, 5, 2)).resolves.toEqual([
			{
				catalogName: "docs",
				itemPath: "section/a.md",
				title: "Article A",
				link: "source/-/repo/branch/docs/section/a.md",
				snippets: ["match one"],
			},
		]);
	});

	test("keeps search engine order", async () => {
		const raw = [
			articleHit("docs/low.md", [{ searchText: "weak" }]),
			articleHit("docs/high.md", [{ searchText: "strong" }]),
		];

		const result = await compactSearchResults(defaultApp, ctx, raw, 5, 2);
		expect(result.map((h) => h.itemPath)).toEqual(["low.md", "high.md"]);
	});

	test("limits number of hits", async () => {
		const raw = [
			articleHit("docs/a.md", [{ searchText: "a" }]),
			articleHit("docs/b.md", [{ searchText: "b" }]),
			articleHit("docs/c.md", [{ searchText: "c" }]),
		];

		const result = await compactSearchResults(defaultApp, ctx, raw, 2, 1);
		expect(result).toHaveLength(2);
	});

	test("limits snippets per hit", async () => {
		const raw = [articleHit("docs/a.md", [{ searchText: "first match" }, { searchText: "second match" }])];

		const result = await compactSearchResults(defaultApp, ctx, raw, 5, 1);
		expect(result[0]?.snippets).toEqual(["first match"]);
	});

	test("collects snippets from nested items", async () => {
		const raw = [
			articleHit("docs/a.md", [
				{
					items: [{ searchText: "nested match" }],
				},
			]),
		];

		const result = await compactSearchResults(defaultApp, ctx, raw, 5, 2);
		expect(result[0]?.snippets).toEqual(["nested match"]);
	});

	test("skips hits without refPath", async () => {
		const raw = [{ items: [{ searchText: "x" }] }, articleHit("docs/ok.md", [{ searchText: "y" }])];

		const result = await compactSearchResults(defaultApp, ctx, raw, 5, 2);
		expect(result).toHaveLength(1);
		expect(result[0]?.itemPath).toBe("ok.md");
	});

	test("skips refPath without item segment", async () => {
		const raw = [articleHit("docs", [{ searchText: "x" }]), articleHit("docs/ok.md", [{ searchText: "y" }])];

		const result = await compactSearchResults(defaultApp, ctx, raw, 5, 2);
		expect(result).toHaveLength(1);
		expect(result[0]?.itemPath).toBe("ok.md");
	});
});
