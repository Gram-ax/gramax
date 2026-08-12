import { act, renderHook } from "@testing-library/react";
import { navigationTreeStore } from "../../store/navigationTreeStore";
import { useInsertionLineState } from "../useInsertionLineState";
import { link, resetNavigationTreeStore, seedTree } from "./navigationTreeStoreTestUtils";

const createArticle = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	resetNavigationTreeStore();
	navigationTreeStore.getState().setOnCreateArticle(createArticle);
});

/**
 * root (level 1)
 *  ├─ a      (level 2)
 *  └─ b      (level 2, folder)
 *      ├─ b1 (level 3)
 *      └─ b2 (level 3, folder)
 *          └─ b2x (level 4) — last child at every level up to root
 */
const seedNestedTree = () => seedTree([link("root", [link("a"), link("b", [link("b1"), link("b2", [link("b2x")])])])]);

describe("depth range", () => {
	test("an open folder only offers its own inside — one depth, one level in", () => {
		seedNestedTree();

		const { result } = renderHook(() => useInsertionLineState("b", 2, true, true));

		expect(result.current.minDepth).toBe(3);
		expect(result.current.maxDepth).toBe(3);
	});

	test("a closed folder behaves like a leaf — it can also take a sibling", () => {
		seedNestedTree();

		const { result } = renderHook(() => useInsertionLineState("b", 2, true, false));

		expect(result.current.maxDepth).toBe(3);
		expect(result.current.minDepth).toBe(1);
	});

	test("an item with a following sibling cannot outdent past its own level", () => {
		seedNestedTree();

		// `b1` has `b2` below it, so a line here can't belong to any shallower parent
		const { result } = renderHook(() => useInsertionLineState("b1", 3, false, false));

		expect(result.current.minDepth).toBe(3);
		expect(result.current.maxDepth).toBe(4);
	});

	test("the last item of a chain of last children can outdent all the way to the root", () => {
		seedNestedTree();

		// b2x is the last child of b2, which is the last child of b — nothing follows it at any level
		const { result } = renderHook(() => useInsertionLineState("b2x", 4, false, false));

		expect(result.current.minDepth).toBe(1);
		expect(result.current.maxDepth).toBe(5);
	});

	test("outdenting stops at the first ancestor that has a sibling below it", () => {
		seedTree([link("root", [link("p", [link("q", [link("qx")])]), link("after-p")])]);

		// qx is last inside q and q is last inside p, but p is followed by `after-p` — so the walk stops at p's level
		const { result } = renderHook(() => useInsertionLineState("qx", 4, false, false));

		expect(result.current.minDepth).toBe(2);
	});
});

describe("handleAdd", () => {
	test("inside an open folder, the new article goes to the top of it", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b", 2, true, true));

		act(() => result.current.handleAdd(3));

		expect(createArticle).toHaveBeenCalledWith("b", undefined);
	});

	test("at a depth below the item, the new article becomes its child", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b1", 3, false, false));

		act(() => result.current.handleAdd(4));

		expect(createArticle).toHaveBeenCalledWith("b1", "b1");
	});

	test("at the item's own depth, the new article becomes its next sibling", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b1", 3, false, false));

		act(() => result.current.handleAdd(3));

		expect(createArticle).toHaveBeenCalledWith("b", "b1");
	});

	test("outdenting places the article after the ancestor at that depth", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b2x", 4, false, false));

		act(() => result.current.handleAdd(3));

		// depth 3 is b2's level — the article lands after b2, inside b
		expect(createArticle).toHaveBeenCalledWith("b", "b2");
	});

	test("outdenting to the root level places the article after the top-level ancestor", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b2x", 4, false, false));

		act(() => result.current.handleAdd(2));

		expect(createArticle).toHaveBeenCalledWith("root", "b");
	});
});

describe("handleParentHover", () => {
	test("publishes the parent and the anchor for the hovered depth", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b2x", 4, false, false));

		act(() => result.current.handleParentHover(3));

		// depth 3 lives inside b; the line is anchored on b2, the item at depth 3
		expect(navigationTreeStore.getState().hoveredParentId).toBe("b");
		expect(navigationTreeStore.getState().hoveredAnchorId).toBe("b2");
	});

	test("clears the hover on null", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("b1", 3, false, false));
		act(() => result.current.handleParentHover(3));

		act(() => result.current.handleParentHover(null));

		expect(navigationTreeStore.getState().hoveredParentId).toBeNull();
		expect(navigationTreeStore.getState().hoveredAnchorId).toBeNull();
	});
});

describe("line visibility", () => {
	test("the anchor and its preceding siblings draw the line", () => {
		seedNestedTree();
		const anchor = renderHook(() => useInsertionLineState("b2", 3, true, false));
		const above = renderHook(() => useInsertionLineState("b1", 3, false, false));

		act(() => navigationTreeStore.getState().setHover("b", "b2"));

		expect(anchor.result.current.isAnchor).toBe(true);
		expect(anchor.result.current.showsLine).toBe(true);
		expect(above.result.current.showsLine).toBe(true);
		expect(above.result.current.isAnchor).toBe(false);
	});

	test("siblings after the anchor draw nothing", () => {
		seedNestedTree();
		const below = renderHook(() => useInsertionLineState("b2", 3, true, false));

		act(() => navigationTreeStore.getState().setHover("b", "b1"));

		expect(below.result.current.showsLine).toBe(false);
	});

	test("hovering a root group draws no line — the group has no vertical rail", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("a", 2, false, false));

		act(() => navigationTreeStore.getState().setHover("root", "a"));

		expect(result.current.showsLine).toBe(false);
	});

	test("items outside the hovered parent draw nothing", () => {
		seedNestedTree();
		const { result } = renderHook(() => useInsertionLineState("a", 2, false, false));

		act(() => navigationTreeStore.getState().setHover("b", "b1"));

		expect(result.current.showsLine).toBe(false);
	});
});
