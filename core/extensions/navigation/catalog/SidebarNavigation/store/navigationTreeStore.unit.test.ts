import type { CategoryLink, ItemLink } from "@ext/navigation/NavigationLinks";
import { DropMode } from "../utils/dropMode";
import type { ChildrenMap, FlatIndex, ParentMap } from "./navigationTreeStore";
import { buildFlatIndex, navigationTreeStore, reconcileExpansion } from "./navigationTreeStore";

type LinkOverrides = Partial<Omit<CategoryLink, "ref" | "items">>;

const link = (path: string, items?: ItemLink[], overrides: LinkOverrides = {}): ItemLink =>
	({ ref: { path }, title: path, items, ...overrides }) as unknown as ItemLink;

const state = () => navigationTreeStore.getState();

const INITIAL = navigationTreeStore.getState();

beforeEach(() => {
	navigationTreeStore.setState(
		{
			...INITIAL,
			flatIndex: {},
			childrenMap: {},
			parentMap: {},
			rootIds: [],
			expanded: new Set<string>(),
			selectedId: "",
			hoveredParentId: null,
			hoveredAnchorId: null,
			draggingId: null,
			dragTarget: null,
			isDragLocked: false,
			onDrop: null,
			onToggle: null,
			onCreateArticle: null,
		},
		true,
	);
});

describe("buildFlatIndex", () => {
	const EMPTY_INDEX: FlatIndex = {};
	const EMPTY_CHILDREN: ChildrenMap = {};
	const EMPTY_PARENTS: ParentMap = {};

	/** First build of a tree — nothing to carry over. */
	const build = (links: ItemLink[]) => buildFlatIndex(links, EMPTY_INDEX, EMPTY_CHILDREN, EMPTY_PARENTS);

	/** Rebuild `links` on top of whatever the previous build produced. */
	const rebuild = (links: ItemLink[], previous: ReturnType<typeof buildFlatIndex>) =>
		buildFlatIndex(links, previous.flatIndex, previous.childrenMap, previous.parentMap);

	describe("shape", () => {
		test("indexes every node by its path, at any depth", () => {
			const { flatIndex } = build([link("a", [link("a/b", [link("a/b/c")])]), link("d")]);

			expect(Object.keys(flatIndex).sort()).toEqual(["a", "a/b", "a/b/c", "d"]);
		});

		test("stores the link object itself under its path", () => {
			const leaf = link("a");

			expect(build([leaf]).flatIndex.a).toBe(leaf);
		});

		test("rootIds keeps the order the links arrived in", () => {
			expect(build([link("b"), link("a"), link("c")]).rootIds).toEqual(["b", "a", "c"]);
		});

		test("childrenMap holds child paths in order, and an empty list for leaves", () => {
			const { childrenMap } = build([link("a", [link("a/x"), link("a/y")])]);

			expect(childrenMap.a).toEqual(["a/x", "a/y"]);
			expect(childrenMap["a/x"]).toEqual([]);
		});

		test("parentMap points each child at its parent, and omits roots", () => {
			const { parentMap } = build([link("a", [link("a/b", [link("a/b/c")])])]);

			expect(parentMap).toEqual({ "a/b": "a", "a/b/c": "a/b" });
			expect(parentMap.a).toBeUndefined();
		});

		test("an empty tree yields empty maps", () => {
			const { flatIndex, childrenMap, parentMap, rootIds } = build([]);

			expect(rootIds).toEqual([]);
			expect(flatIndex).toEqual({});
			expect(childrenMap).toEqual({});
			expect(parentMap).toEqual({});
		});
	});

	describe("identity across rebuilds", () => {
		test("an unchanged tree returns the very same maps", () => {
			const tree = () => [link("a", [link("a/b")])];
			const first = build(tree());

			const second = rebuild(tree(), first);

			// items memoize on these — new maps for an unchanged tree would re-render the whole catalog
			expect(second.flatIndex).toBe(first.flatIndex);
			expect(second.childrenMap).toBe(first.childrenMap);
			expect(second.parentMap).toBe(first.parentMap);
		});

		test("an untouched item keeps its entry when a sibling changes", () => {
			const first = build([link("a"), link("b")]);

			const second = rebuild([link("a"), link("b", undefined, { title: "renamed" })], first);

			expect(second.flatIndex.a).toBe(first.flatIndex.a);
			expect(second.flatIndex).not.toBe(first.flatIndex);
		});

		test("an item whose props changed is replaced by the incoming link", () => {
			const first = build([link("a", undefined, { title: "old" })]);
			const incoming = link("a", undefined, { title: "new" });

			expect(rebuild([incoming], first).flatIndex.a).toBe(incoming);
		});

		test("a parent keeps its children array when only a child's props changed", () => {
			const first = build([link("a", [link("a/b")])]);

			// the child list is still ["a/b"] — only the child's own entry should be rebuilt
			const second = rebuild([link("a", [link("a/b", undefined, { title: "renamed" })])], first);

			expect(second.childrenMap).toBe(first.childrenMap);
			expect(second.flatIndex["a/b"]).not.toBe(first.flatIndex["a/b"]);
		});

		test("reordering children produces a new children array", () => {
			const first = build([link("a", [link("a/x"), link("a/y")])]);

			const second = rebuild([link("a", [link("a/y"), link("a/x")])], first);

			expect(second.childrenMap.a).toEqual(["a/y", "a/x"]);
			expect(second.childrenMap).not.toBe(first.childrenMap);
		});

		test("adding a child rebuilds the children map but keeps the untouched siblings' entries", () => {
			const first = build([link("a", [link("a/x")])]);

			const second = rebuild([link("a", [link("a/x"), link("a/new")])], first);

			expect(second.childrenMap.a).toEqual(["a/x", "a/new"]);
			expect(second.flatIndex["a/x"]).toBe(first.flatIndex["a/x"]);
		});

		test("removing an item drops it from every map", () => {
			const first = build([link("a", [link("a/x")]), link("gone")]);

			const second = rebuild([link("a", [link("a/x")])], first);

			expect(second.flatIndex.gone).toBeUndefined();
			expect(second.childrenMap.gone).toBeUndefined();
			expect(second.flatIndex).not.toBe(first.flatIndex);
		});

		test("moving an item to a new parent rewrites parentMap", () => {
			const first = build([link("a", [link("x")]), link("b")]);

			const second = rebuild([link("a"), link("b", [link("x")])], first);

			expect(second.parentMap.x).toBe("b");
			expect(second.parentMap).not.toBe(first.parentMap);
		});
	});

	describe("what counts as a changed item", () => {
		// sameItem compares this exact field set; a change in any of them must yield a fresh entry
		test.each([
			["title", { title: "changed" }],
			["icon", { icon: "changed" }],
			["isCurrentLink", { isCurrentLink: true }],
			["pathname", { pathname: "/changed" }],
			["isExpanded", { isExpanded: true }],
			["existContent", { existContent: true }],
		] as [string, LinkOverrides][])("%s replaces the entry", (_field, overrides) => {
			const first = build([link("a")]);

			const second = rebuild([link("a", undefined, overrides)], first);

			expect(second.flatIndex.a).not.toBe(first.flatIndex.a);
		});

		test("a field outside that set does not replace the entry", () => {
			const first = build([link("a")]);

			// `query` is not part of the comparison, so the previous entry is reused
			const second = rebuild([link("a", undefined, { query: { v: "1" } })], first);

			expect(second.flatIndex.a).toBe(first.flatIndex.a);
		});
	});
});

describe("reconcileExpansion", () => {
	const index = (...links: ItemLink[]): FlatIndex =>
		Object.fromEntries(links.map((l) => [l.ref.path, l])) as FlatIndex;

	const EMPTY: FlatIndex = {};

	test("opens a brand-new item that arrives pre-expanded", () => {
		const next = index(link("a", undefined, { isExpanded: true }));

		const { expanded } = reconcileExpansion(next, EMPTY, new Set());

		expect([...expanded]).toEqual(["a"]);
	});

	test("leaves a brand-new item closed when it is not pre-expanded", () => {
		const next = index(link("a", undefined, { isExpanded: false }));

		const { expanded } = reconcileExpansion(next, EMPTY, new Set());

		expect(expanded.size).toBe(0);
	});

	test("ignores isExpanded on an item the store already knew", () => {
		const known = link("a", undefined, { isExpanded: true });

		// the user collapsed `a` after it first arrived; a refresh must not reopen it
		const { expanded } = reconcileExpansion(index(known), index(known), new Set());

		expect(expanded.has("a")).toBe(false);
	});

	test("keeps an item the user opened, even though it is not pre-expanded", () => {
		const known = link("a", undefined, { isExpanded: false });

		const { expanded } = reconcileExpansion(index(known), index(known), new Set(["a"]));

		expect(expanded.has("a")).toBe(true);
	});

	test("forgets ids that dropped out of the tree", () => {
		const { expanded } = reconcileExpansion(
			index(link("a")),
			index(link("a"), link("gone")),
			new Set(["a", "gone"]),
		);

		expect([...expanded]).toEqual(["a"]);
	});

	test("a path that reappears comes back closed rather than inheriting its old state", () => {
		const removed = reconcileExpansion(EMPTY, index(link("a")), new Set(["a"]));

		// `a` was forgotten on removal, so re-adding it (without isExpanded) must not resurrect the open state
		const readded = reconcileExpansion(index(link("a")), EMPTY, removed.expanded);

		expect(readded.expanded.has("a")).toBe(false);
	});

	test("does not mutate the set it was given", () => {
		const previous = new Set(["gone"]);

		reconcileExpansion(index(link("a", undefined, { isExpanded: true })), EMPTY, previous);

		expect([...previous]).toEqual(["gone"]);
	});

	test("picks the current link as the selection", () => {
		const next = index(link("a"), link("b", undefined, { isCurrentLink: true }));

		expect(reconcileExpansion(next, EMPTY, new Set()).selectedId).toBe("b");
	});

	test("selects nothing when no item is the current link", () => {
		expect(reconcileExpansion(index(link("a")), EMPTY, new Set()).selectedId).toBe("");
	});
});

describe("setNavItems", () => {
	test("atomically replaces language-scoped items and clears transient drag state", () => {
		state().setNavItems([link("catalog/ru")], "catalog:ru");
		state().toggleExpanded("catalog/ru", true);
		state().setHover("catalog/ru", "catalog/ru/article");
		state().setDragging("catalog/ru/article");
		state().setDragTarget({ anchorId: "catalog/ru", parentId: null, mode: DropMode.Into });
		state().setDragLocked(true);

		state().setNavItems([link("catalog/en", undefined, { isExpanded: true })], "catalog:en");

		expect(state().scope).toBe("catalog:en");
		expect(Object.keys(state().flatIndex)).toEqual(["catalog/en"]);
		expect(state().rootIds).toEqual(["catalog/en"]);
		expect([...state().expanded]).toEqual(["catalog/en"]);
		expect(state().hoveredParentId).toBeNull();
		expect(state().hoveredAnchorId).toBeNull();
		expect(state().draggingId).toBeNull();
		expect(state().dragTarget).toBeNull();
		expect(state().isDragLocked).toBe(false);
	});

	test("flattens the nested tree into index, children and parent maps", () => {
		state().setNavItems([link("a", [link("a/b", [link("a/b/c")])]), link("d")]);

		expect(Object.keys(state().flatIndex).sort()).toEqual(["a", "a/b", "a/b/c", "d"]);
		expect(state().rootIds).toEqual(["a", "d"]);
		expect(state().childrenMap).toEqual({ a: ["a/b"], "a/b": ["a/b/c"], "a/b/c": [], d: [] });
		expect(state().parentMap).toEqual({ "a/b": "a", "a/b/c": "a/b" });
	});

	test("keeps map references identical when the tree is unchanged", () => {
		const sameTree = () => [link("a", [link("a/b")])];
		state().setNavItems(sameTree());
		const { flatIndex, childrenMap, parentMap, rootIds } = state();

		state().setNavItems(sameTree());

		// Item components subscribe to these maps — a new reference on an unchanged tree re-renders the catalog.
		expect(state().flatIndex).toBe(flatIndex);
		expect(state().childrenMap).toBe(childrenMap);
		expect(state().parentMap).toBe(parentMap);
		expect(state().rootIds).toBe(rootIds);
	});

	test("keeps the entry of an untouched item when a sibling changes", () => {
		state().setNavItems([link("a"), link("b")]);
		const untouched = state().flatIndex.a;

		state().setNavItems([link("a"), link("b", undefined, { title: "renamed" })]);

		expect(state().flatIndex.a).toBe(untouched);
		expect(state().flatIndex.b.title).toBe("renamed");
		expect(state().flatIndex).not.toBe(untouched);
	});

	test("replaces the entry of an item whose props changed", () => {
		state().setNavItems([link("a", undefined, { title: "old" })]);
		state().setNavItems([link("a", undefined, { title: "new" })]);

		expect(state().flatIndex.a.title).toBe("new");
	});

	test("expands a newly added item that arrives pre-expanded", () => {
		state().setNavItems([link("a", [link("a/b")], { isExpanded: true })]);

		expect(state().expanded.has("a")).toBe(true);
	});

	test("does not re-expand a known item the user has since collapsed", () => {
		state().setNavItems([link("a", [link("a/b")], { isExpanded: true })]);
		state().toggleExpanded("a", false);

		state().setNavItems([link("a", [link("a/b")], { isExpanded: true })]);

		expect(state().expanded.has("a")).toBe(false);
	});

	test("drops expanded ids that no longer exist in the tree", () => {
		state().setNavItems([link("a", [link("a/b")]), link("gone")]);
		state().toggleExpanded("gone", true);
		expect(state().expanded.has("gone")).toBe(true);

		state().setNavItems([link("a", [link("a/b")])]);

		expect(state().expanded.has("gone")).toBe(false);
	});

	test("selects the item flagged as the current link", () => {
		state().setNavItems([link("a", [link("a/b", undefined, { isCurrentLink: true })])]);

		expect(state().selectedId).toBe("a/b");
	});

	test("clears the selection when no item is the current link", () => {
		state().setNavItems([link("a", undefined, { isCurrentLink: true })]);
		state().setNavItems([link("a")]);

		expect(state().selectedId).toBe("");
	});
});

describe("toggleExpanded", () => {
	test("adds and removes the id, notifying onToggle both ways", () => {
		const onToggle = jest.fn();
		state().setOnToggle(onToggle);

		state().toggleExpanded("a", true);
		expect(state().expanded.has("a")).toBe(true);
		expect(onToggle).toHaveBeenLastCalledWith("a", true);

		state().toggleExpanded("a", false);
		expect(state().expanded.has("a")).toBe(false);
		expect(onToggle).toHaveBeenLastCalledWith("a", false);
	});

	test("replaces the set rather than mutating it", () => {
		const before = state().expanded;
		state().toggleExpanded("a", true);

		expect(state().expanded).not.toBe(before);
		expect(before.has("a")).toBe(false);
	});

	test("works without an onToggle listener", () => {
		expect(() => state().toggleExpanded("a", true)).not.toThrow();
	});

	test("reopening a collapsed parent replaces its persisted false override", () => {
		const onToggle = jest.fn();
		state().setOnToggle(onToggle);
		state().toggleExpanded("a", false);

		state().toggleExpanded("a", true);

		expect(state().expanded.has("a")).toBe(true);
		expect(onToggle).toHaveBeenLastCalledWith("a", true);
	});
});

describe("select", () => {
	test("selects the id and expands it", () => {
		const onToggle = jest.fn();
		state().setOnToggle(onToggle);

		state().select("a/b");

		expect(state().selectedId).toBe("a/b");
		expect(state().expanded.has("a/b")).toBe(true);
		expect(onToggle).toHaveBeenCalledWith("a/b", true);
	});
});

describe("setHover", () => {
	test("stores the hovered parent and anchor", () => {
		state().setHover("a", "a/b");

		expect(state().hoveredParentId).toBe("a");
		expect(state().hoveredAnchorId).toBe("a/b");
	});

	test("returns the same state object when the hover is unchanged", () => {
		state().setHover("a", "a/b");
		const before = state();

		state().setHover("a", "a/b");

		// pointermove fires this on every frame; a fresh state object each time re-renders every subscriber
		expect(state()).toBe(before);
	});

	test("clears the hover", () => {
		state().setHover("a", "a/b");
		state().setHover(null, null);

		expect(state().hoveredParentId).toBeNull();
		expect(state().hoveredAnchorId).toBeNull();
	});
});

describe("drag state", () => {
	test("setDragging clears any stale drag target", () => {
		state().setDragTarget({ anchorId: "a", parentId: null, mode: DropMode.Into });

		state().setDragging("b");

		expect(state().draggingId).toBe("b");
		expect(state().dragTarget).toBeNull();
	});

	test("setDragTarget stores the target", () => {
		const target = { anchorId: "a", parentId: "root", mode: DropMode.After };
		state().setDragTarget(target);

		expect(state().dragTarget).toEqual(target);
	});

	test("setDragTarget keeps the state object when the target is unchanged", () => {
		state().setDragTarget({ anchorId: "a", parentId: "root", mode: DropMode.After });
		const before = state();

		state().setDragTarget({ anchorId: "a", parentId: "root", mode: DropMode.After });

		expect(state()).toBe(before);
	});

	test("setDragLocked toggles the lock", () => {
		state().setDragLocked(true);
		expect(state().isDragLocked).toBe(true);

		state().setDragLocked(false);
		expect(state().isDragLocked).toBe(false);
	});
});

describe("callback registration", () => {
	test("setOnDrop and setOnCreateArticle store and clear the callbacks", () => {
		const onDrop = jest.fn();
		const onCreateArticle = jest.fn();

		state().setOnDrop(onDrop);
		state().setOnCreateArticle(onCreateArticle);
		expect(state().onDrop).toBe(onDrop);
		expect(state().onCreateArticle).toBe(onCreateArticle);

		state().setOnDrop(null);
		state().setOnCreateArticle(null);
		expect(state().onDrop).toBeNull();
		expect(state().onCreateArticle).toBeNull();
	});
});
