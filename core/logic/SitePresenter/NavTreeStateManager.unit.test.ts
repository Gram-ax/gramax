import { ItemType } from "@core/FileStructue/Item/ItemType";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import {
	applyNavTreeState,
	collectExpandedPaths,
	getOpenPaths,
	syncCatalogState,
	useNavTreeStore,
} from "./NavTreeStateManager";

const makeArticle = (path: string, title = "article"): ItemLink => ({
	type: ItemType.article,
	title,
	icon: "",
	isCurrentLink: false,
	ref: { path } as any,
	pathname: `/${path}`,
});

const makeCategory = (path: string, items: ItemLink[] = [], isExpanded = false, title = "category"): CategoryLink => ({
	type: ItemType.category,
	title,
	icon: "",
	isCurrentLink: false,
	ref: { path } as any,
	pathname: `/${path}`,
	items,
	isExpanded,
});

beforeEach(() => {
	useNavTreeStore.setState({ catalogs: {} });
});

describe("collectExpandedPaths", () => {
	test("returns empty array for empty items", () => {
		expect(collectExpandedPaths([])).toEqual([]);
	});

	test("ignores article items", () => {
		const items: ItemLink[] = [makeArticle("a.md"), makeArticle("b.md")];
		expect(collectExpandedPaths(items)).toEqual([]);
	});

	test("always includes root-level categories regardless of isExpanded", () => {
		const items: ItemLink[] = [
			makeCategory("cat-a/_index.md", [], false),
			makeCategory("cat-b/_index.md", [], false),
		];
		const result = collectExpandedPaths(items);
		expect(result).toEqual(["cat-a/_index.md", "cat-b/_index.md"]);
	});

	test("includes nested categories only when isExpanded is true", () => {
		const nested = makeCategory("parent/child/_index.md", [], true);
		const collapsedNested = makeCategory("parent/closed/_index.md", [], false);
		const root = makeCategory("parent/_index.md", [nested, collapsedNested], false);

		const result = collectExpandedPaths([root]);
		expect(result).toContain("parent/_index.md");
		expect(result).toContain("parent/child/_index.md");
		expect(result).not.toContain("parent/closed/_index.md");
	});

	test("recursively collects deeply nested expanded paths", () => {
		const deep = makeCategory("a/b/c/_index.md", [], true);
		const mid = makeCategory("a/b/_index.md", [deep], true);
		const root = makeCategory("a/_index.md", [mid], false);

		const result = collectExpandedPaths([root]);
		expect(result).toEqual(["a/_index.md", "a/b/_index.md", "a/b/c/_index.md"]);
	});

	test("stops recursion at collapsed nested categories", () => {
		const deep = makeCategory("a/b/c/_index.md", [], true);
		const mid = makeCategory("a/b/_index.md", [deep], false);
		const root = makeCategory("a/_index.md", [mid], false);

		const result = collectExpandedPaths([root]);
		expect(result).toEqual(["a/_index.md"]);
		expect(result).not.toContain("a/b/_index.md");
		expect(result).not.toContain("a/b/c/_index.md");
	});

	test("handles mixed articles and categories", () => {
		const items: ItemLink[] = [
			makeArticle("intro.md"),
			makeCategory("section/_index.md", [makeArticle("section/page.md")], false),
			makeArticle("outro.md"),
		];
		const result = collectExpandedPaths(items);
		expect(result).toEqual(["section/_index.md"]);
	});
});

describe("useNavTreeStore", () => {
	test("initial state has empty catalogs", () => {
		expect(useNavTreeStore.getState().catalogs).toEqual({});
	});

	test("setCatalog stores paths for a catalog", () => {
		useNavTreeStore.getState().setCatalog("my-catalog", ["path/a", "path/b"]);
		expect(useNavTreeStore.getState().catalogs["my-catalog"]).toEqual(["path/a", "path/b"]);
	});

	test("setCatalog overwrites previous paths", () => {
		useNavTreeStore.getState().setCatalog("cat", ["old"]);
		useNavTreeStore.getState().setCatalog("cat", ["new-a", "new-b"]);
		expect(useNavTreeStore.getState().catalogs["cat"]).toEqual(["new-a", "new-b"]);
	});

	test("setCatalog does not affect other catalogs", () => {
		useNavTreeStore.getState().setCatalog("cat-1", ["a"]);
		useNavTreeStore.getState().setCatalog("cat-2", ["b"]);
		expect(useNavTreeStore.getState().catalogs["cat-1"]).toEqual(["a"]);
		expect(useNavTreeStore.getState().catalogs["cat-2"]).toEqual(["b"]);
	});
});

describe("getOpenPaths", () => {
	test("returns null when catalog is not in store", () => {
		expect(getOpenPaths("unknown")).toBeNull();
	});

	test("returns stored paths for known catalog", () => {
		useNavTreeStore.getState().setCatalog("test", ["x", "y"]);
		expect(getOpenPaths("test")).toEqual(["x", "y"]);
	});

	test("returns empty array if catalog was saved with no open paths", () => {
		useNavTreeStore.getState().setCatalog("empty", []);
		expect(getOpenPaths("empty")).toEqual([]);
	});
});

describe("syncCatalogState", () => {
	test("does nothing when catalog is not in store", () => {
		const items: ItemLink[] = [makeCategory("root/_index.md", [], false)];
		syncCatalogState("nonexistent", items);
		expect(useNavTreeStore.getState().catalogs).toEqual({});
	});

	test("merges server-expanded hints into saved state", () => {
		useNavTreeStore.getState().setCatalog("cat", ["root/_index.md"]);

		const serverExpanded = makeCategory("root/child/_index.md", [], true);
		const root = makeCategory("root/_index.md", [serverExpanded], false);

		syncCatalogState("cat", [root]);

		const saved = useNavTreeStore.getState().catalogs["cat"];
		expect(saved).toContain("root/_index.md");
		expect(saved).toContain("root/child/_index.md");
	});

	test("does not duplicate already-saved paths", () => {
		useNavTreeStore.getState().setCatalog("cat", ["root/_index.md", "root/child/_index.md"]);

		const serverExpanded = makeCategory("root/child/_index.md", [], true);
		const root = makeCategory("root/_index.md", [serverExpanded], false);

		syncCatalogState("cat", [root]);

		const saved = useNavTreeStore.getState().catalogs["cat"];
		expect(saved).toEqual(["root/_index.md", "root/child/_index.md"]);
	});

	test("ignores root-level server hints (only level > 0)", () => {
		useNavTreeStore.getState().setCatalog("cat", []);

		const root = makeCategory("root/_index.md", [], true);
		syncCatalogState("cat", [root]);

		const saved = useNavTreeStore.getState().catalogs["cat"];
		expect(saved).toEqual([]);
	});

	test("removes saved paths that no longer exist in items (pruning)", () => {
		useNavTreeStore
			.getState()
			.setCatalog("cat", ["root/_index.md", "root/child/_index.md", "root/deleted/_index.md"]);

		const child = makeCategory("root/child/_index.md", [], false);
		const root = makeCategory("root/_index.md", [child], false);
		syncCatalogState("cat", [root]);

		const saved = useNavTreeStore.getState().catalogs["cat"];
		expect(saved).toContain("root/_index.md");
		expect(saved).toContain("root/child/_index.md");
		expect(saved).not.toContain("root/deleted/_index.md");
	});

	test("prunes and merges hints in a single sync call", () => {
		useNavTreeStore.getState().setCatalog("cat", ["root/_index.md", "root/old/_index.md"]);

		const newExpanded = makeCategory("root/new/_index.md", [], true);
		const root = makeCategory("root/_index.md", [newExpanded], false);
		syncCatalogState("cat", [root]);

		const saved = useNavTreeStore.getState().catalogs["cat"];
		expect(saved).toContain("root/_index.md");
		expect(saved).toContain("root/new/_index.md");
		expect(saved).not.toContain("root/old/_index.md");
	});
});

describe("applyNavTreeState", () => {
	test("returns items unchanged when catalog is not in store", () => {
		const items: ItemLink[] = [makeCategory("a/_index.md", [], false)];
		const result = applyNavTreeState("unknown", items);
		expect(result).toBe(items);
	});

	test("expands categories whose paths are in saved state", () => {
		useNavTreeStore.getState().setCatalog("cat", ["a/_index.md"]);

		const items: ItemLink[] = [makeCategory("a/_index.md", [], false), makeCategory("b/_index.md", [], false)];
		const result = applyNavTreeState("cat", items);

		expect((result[0] as CategoryLink).isExpanded).toBe(true);
		expect((result[1] as CategoryLink).isExpanded).toBe(false);
	});

	test("collapses categories not in saved state", () => {
		useNavTreeStore.getState().setCatalog("cat", []);

		const items: ItemLink[] = [makeCategory("a/_index.md", [], true)];
		const result = applyNavTreeState("cat", items);

		expect((result[0] as CategoryLink).isExpanded).toBe(false);
	});

	test("applies state recursively to nested categories", () => {
		useNavTreeStore.getState().setCatalog("cat", ["root/_index.md", "root/deep/_index.md"]);

		const deep = makeCategory("root/deep/_index.md", [], false);
		const mid = makeCategory("root/mid/_index.md", [deep], false);
		const root = makeCategory("root/_index.md", [mid], false);

		const result = applyNavTreeState("cat", [root]);

		const rootResult = result[0] as CategoryLink;
		expect(rootResult.isExpanded).toBe(true);

		const midResult = rootResult.items[0] as CategoryLink;
		expect(midResult.isExpanded).toBe(false);

		const deepResult = midResult.items[0] as CategoryLink;
		expect(deepResult.isExpanded).toBe(true);
	});

	test("does not modify article items", () => {
		useNavTreeStore.getState().setCatalog("cat", ["article.md"]);

		const items: ItemLink[] = [makeArticle("article.md")];
		const result = applyNavTreeState("cat", items);

		expect(result[0].type).toBe(ItemType.article);
	});

	test("handles empty saved state — collapses everything", () => {
		useNavTreeStore.getState().setCatalog("cat", []);

		const child = makeCategory("root/child/_index.md", [], true);
		const root = makeCategory("root/_index.md", [child], true);
		const result = applyNavTreeState("cat", [root]);

		expect((result[0] as CategoryLink).isExpanded).toBe(false);
		expect(((result[0] as CategoryLink).items[0] as CategoryLink).isExpanded).toBe(false);
	});
});
