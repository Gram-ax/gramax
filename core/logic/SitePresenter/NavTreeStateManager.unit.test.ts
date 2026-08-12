import { ItemType } from "@core/FileStructue/Item/ItemType";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import {
	applyOverrides,
	expandParentOf,
	getCatalogOverrides,
	migrateNavTreeState,
	reconcileDroppedNodes,
	setCategoryOverride,
	syncOverrides,
	useNavTreeStore,
} from "./NavTreeStateManager";

const makeArticle = (path: string, title = "article"): ItemLink => ({
	type: ItemType.article,
	title,
	fileName: path,
	icon: "",
	isCurrentLink: false,
	ref: { path, storageId: "" },
	pathname: `/${path}`,
});

const makeCategory = (path: string, items: ItemLink[] = [], isExpanded = false, title = "category"): CategoryLink => ({
	type: ItemType.category,
	title,
	fileName: path,
	icon: "",
	isCurrentLink: false,
	ref: { path, storageId: "" },
	pathname: `/${path}`,
	items,
	isExpanded,
});

beforeEach(() => {
	useNavTreeStore.setState({ catalogs: {} });
});

describe("store", () => {
	test("initial state has empty catalogs", () => {
		expect(useNavTreeStore.getState().catalogs).toEqual({});
	});

	test("setCatalogOverrides stores and overwrites per catalog without touching others", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat-1", { a: true });
		useNavTreeStore.getState().setCatalogOverrides("cat-2", { b: false });
		useNavTreeStore.getState().setCatalogOverrides("cat-1", { c: true });

		expect(useNavTreeStore.getState().catalogs["cat-1"]).toEqual({ c: true });
		expect(useNavTreeStore.getState().catalogs["cat-2"]).toEqual({ b: false });
	});

	test("getCatalogOverrides returns an empty object for an unknown catalog", () => {
		expect(getCatalogOverrides("unknown")).toEqual({});
	});
});

describe("applyOverrides", () => {
	test("falls back to the server default when there is no override", () => {
		const items: ItemLink[] = [makeCategory("a/_index.md", [], true), makeCategory("b/_index.md", [], false)];
		const result = applyOverrides(items, {});
		expect((result[0] as CategoryLink).isExpanded).toBe(true);
		expect((result[1] as CategoryLink).isExpanded).toBe(false);
	});

	test("override wins over the server default in both directions", () => {
		const items: ItemLink[] = [
			makeCategory("open-by-default/_index.md", [], true),
			makeCategory("closed-by-default/_index.md", [], false),
		];
		const result = applyOverrides(items, {
			"open-by-default/_index.md": false,
			"closed-by-default/_index.md": true,
		});
		expect((result[0] as CategoryLink).isExpanded).toBe(false);
		expect((result[1] as CategoryLink).isExpanded).toBe(true);
	});

	test("applies recursively to nested categories", () => {
		const deep = makeCategory("root/mid/deep/_index.md", [], false);
		const mid = makeCategory("root/mid/_index.md", [deep], false);
		const root = makeCategory("root/_index.md", [mid], true);

		const result = applyOverrides([root], { "root/mid/deep/_index.md": true });

		const rootResult = result[0] as CategoryLink;
		expect(rootResult.isExpanded).toBe(true);
		expect((rootResult.items[0] as CategoryLink).isExpanded).toBe(false);
		expect(((rootResult.items[0] as CategoryLink).items[0] as CategoryLink).isExpanded).toBe(true);
	});

	test("does not modify article items", () => {
		const items: ItemLink[] = [makeArticle("article.md")];
		const result = applyOverrides(items, { "article.md": true });
		expect(result[0]).toEqual(makeArticle("article.md"));
	});
});

describe("setCategoryOverride", () => {
	test("records an explicit expand", () => {
		setCategoryOverride("cat", "a/_index.md", true);
		expect(getCatalogOverrides("cat")).toEqual({ "a/_index.md": true });
	});

	test("records an explicit collapse", () => {
		setCategoryOverride("cat", "a/_index.md", false);
		expect(getCatalogOverrides("cat")).toEqual({ "a/_index.md": false });
	});

	test("collapsing a category forces its descendants' overrides to false so reopening does not restore the subtree", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", {
			"root/_index.md": true,
			"root/mid/_index.md": true,
			"root/mid/deep/_index.md": true,
		});

		setCategoryOverride("cat", "root/_index.md", false);

		expect(getCatalogOverrides("cat")).toEqual({
			"root/_index.md": false,
			"root/mid/_index.md": false,
			"root/mid/deep/_index.md": false,
		});
	});

	test("collapsing a category leaves overrides outside its subtree untouched", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", {
			"root/_index.md": true,
			"root/mid/_index.md": true,
			"root-sibling/_index.md": true,
		});

		setCategoryOverride("cat", "root/_index.md", false);

		expect(getCatalogOverrides("cat")).toEqual({
			"root/_index.md": false,
			"root/mid/_index.md": false,
			"root-sibling/_index.md": true,
		});
	});

	test("does nothing without a catalog name", () => {
		setCategoryOverride("", "a/_index.md", true);
		expect(useNavTreeStore.getState().catalogs).toEqual({});
	});
});

describe("syncOverrides", () => {
	test("drops overrides for categories that no longer exist in the tree", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", {
			"root/_index.md": false,
			"root/child/_index.md": true,
			"root/deleted/_index.md": true,
		});

		const child = makeCategory("root/child/_index.md", [], false);
		const root = makeCategory("root/_index.md", [child], false);
		syncOverrides("cat", [root]);

		expect(getCatalogOverrides("cat")).toEqual({
			"root/_index.md": false,
			"root/child/_index.md": true,
		});
	});

	test("persists server-expanded non-root categories so they stay open after the current article changes", () => {
		const deep = makeCategory("root/child/deep/_index.md", [], false);
		const child = makeCategory("root/child/_index.md", [deep], true);
		const root = makeCategory("root/_index.md", [child], true);

		syncOverrides("cat", [root]);

		expect(getCatalogOverrides("cat")).toEqual({ "root/child/_index.md": true });
	});

	test("does not overwrite an explicit user choice with a server expansion", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", { "root/child/_index.md": false });

		const child = makeCategory("root/child/_index.md", [], true);
		const root = makeCategory("root/_index.md", [child], true);
		syncOverrides("cat", [root]);

		expect(getCatalogOverrides("cat")).toEqual({ "root/child/_index.md": false });
	});

	test("does not rewrite the store when nothing is stale or newly expanded", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", { "root/_index.md": true });
		const before = useNavTreeStore.getState().catalogs.cat;

		syncOverrides("cat", [makeCategory("root/_index.md", [], true)]);

		expect(useNavTreeStore.getState().catalogs.cat).toBe(before);
	});

	test("is a no-op for an empty tree", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", { "root/_index.md": true });
		syncOverrides("cat", []);
		expect(getCatalogOverrides("cat")).toEqual({ "root/_index.md": true });
	});
});

describe("expandParentOf", () => {
	const childPath = "-/-/-/-/my-catalog/folder/new-article.md";
	const parentPath = "my-catalog/folder/_index.md";

	test("removes the parent's collapse override so it reverts to the default-open rule", () => {
		useNavTreeStore.getState().setCatalogOverrides("my-catalog", {
			[parentPath]: false,
			"my-catalog/other/_index.md": true,
		});

		expandParentOf(childPath);

		expect(getCatalogOverrides("my-catalog")).toEqual({ "my-catalog/other/_index.md": true });
	});

	test("does nothing when the parent has no override", () => {
		useNavTreeStore.getState().setCatalogOverrides("my-catalog", { "my-catalog/other/_index.md": true });
		expandParentOf(childPath);
		expect(getCatalogOverrides("my-catalog")).toEqual({ "my-catalog/other/_index.md": true });
	});
});

describe("reconcileDroppedNodes", () => {
	const makeNode = (path: string, isExpanded?: boolean, type = ItemType.category): NodeModel<ItemLink> => ({
		id: path,
		parent: 0,
		text: path,
		data: type === ItemType.category ? makeCategory(path, [], !!isExpanded) : makeArticle(path),
	});

	test("re-applies a user override onto the server's fresh expansion flags", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", { "a/_index.md": true });
		const previous = [makeNode("a/_index.md", true)];
		const dropped = [makeNode("a/_index.md", false)];

		const result = reconcileDroppedNodes("cat", previous, dropped, "x/_index.md");

		expect((result[0].data as CategoryLink).isExpanded).toBe(true);
	});

	test("keeps the server default when there is no override", () => {
		const previous = [makeNode("a/_index.md", false)];
		const dropped = [makeNode("a/_index.md", true)];

		const result = reconcileDroppedNodes("cat", previous, dropped, "x/_index.md");

		expect((result[0].data as CategoryLink).isExpanded).toBe(true);
		expect(result[0]).toBe(dropped[0]);
	});

	test("carries the dragged category's expansion to the path it landed on", () => {
		const previous = [makeNode("old/folder/_index.md", true)];
		const dropped = [makeNode("new/folder/_index.md", false)];

		const result = reconcileDroppedNodes("cat", previous, dropped, "old/folder/_index.md");

		expect((result[0].data as CategoryLink).isExpanded).toBe(true);
	});

	test("leaves articles untouched", () => {
		const dropped = [makeNode("article.md", undefined, ItemType.article)];
		const result = reconcileDroppedNodes("cat", [], dropped, "x/_index.md");
		expect(result[0]).toBe(dropped[0]);
	});
});

describe("migration / legacy data", () => {
	test("migrate discards any old persisted state (delete, don't translate)", () => {
		expect(migrateNavTreeState()).toEqual({ catalogs: {} });
	});

	test("getCatalogOverrides ignores a legacy v0 array value", () => {
		useNavTreeStore.setState({
			catalogs: { cat: ["a/_index.md", "b/_index.md"] as unknown as Record<string, boolean> },
		});
		expect(getCatalogOverrides("cat")).toEqual({});
	});
});

describe("content-language normalization", () => {
	const langs = [ContentLanguage.en, ContentLanguage.ru];
	const enPath = "new-catalog/new/en/11/_index.md";
	const ruPath = "new-catalog/new/11/_index.md";

	test("strips the language segment wherever it appears, not only after the catalog name", () => {
		setCategoryOverride("cat", enPath, true, langs);
		expect(getCatalogOverrides("cat")).toEqual({ [ruPath]: true });
	});

	test("applyOverrides matches a secondary-language path to the language-stripped override", () => {
		const result = applyOverrides([makeCategory(enPath, [], false)], { [ruPath]: true }, langs);
		expect((result[0] as CategoryLink).isExpanded).toBe(true);
	});

	test("an item expanded in the primary language stays expanded in the secondary view", () => {
		setCategoryOverride("cat", ruPath, true, langs);
		const result = applyOverrides([makeCategory(enPath, [], false)], getCatalogOverrides("cat"), langs);
		expect((result[0] as CategoryLink).isExpanded).toBe(true);
	});

	test("syncOverrides does not prune keys that only differ by language segment", () => {
		useNavTreeStore.getState().setCatalogOverrides("cat", { [ruPath]: true });
		syncOverrides("cat", [makeCategory(enPath, [], false)], langs);
		expect(getCatalogOverrides("cat")).toEqual({ [ruPath]: true });
	});

	test("strips whole-segment language codes only, not lookalike folder names", () => {
		const path = "new-catalog/england/en/article/_index.md";
		setCategoryOverride("cat", path, true, langs);
		expect(getCatalogOverrides("cat")).toEqual({ "new-catalog/england/article/_index.md": true });
	});

	test("strips only the first language segment, keeping a real folder named like a language", () => {
		const path = "new-catalog/en/folder/en/_index.md";
		setCategoryOverride("cat", path, true, langs);
		expect(getCatalogOverrides("cat")).toEqual({ "new-catalog/folder/en/_index.md": true });
	});
});
