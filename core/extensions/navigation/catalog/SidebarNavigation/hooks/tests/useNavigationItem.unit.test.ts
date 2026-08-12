import { act, renderHook } from "@testing-library/react";
import { navigationTreeStore } from "../../store/navigationTreeStore";
import { useNavigationItem } from "../useNavigationItem";
import { link, resetNavigationTreeStore, seedTree } from "./navigationTreeStoreTestUtils";

beforeEach(() => {
	resetNavigationTreeStore();
	seedTree([link("a", [link("a/b"), link("a/c")]), link("d")]);
});

describe("useNavigationItem", () => {
	test("exposes the item's own data and children", () => {
		const { result } = renderHook(() => useNavigationItem("a"));

		expect(result.current.data.ref.path).toBe("a");
		expect(result.current.children).toEqual(["a/b", "a/c"]);
	});

	test("returns undefined data for an id that is not in the tree", () => {
		const { result } = renderHook(() => useNavigationItem("missing"));

		expect(result.current.data).toBeUndefined();
		expect(result.current.children).toEqual([]);
	});

	test("hands leaves the same empty-children array every time", () => {
		const { result, rerender } = renderHook(() => useNavigationItem("a/b"));
		const first = result.current.children;

		act(() => navigationTreeStore.getState().setDragLocked(true));
		rerender();

		// a fresh `[]` per call would break zustand's Object.is check and re-render every leaf on any store change
		expect(result.current.children).toBe(first);
	});

	test("open follows the expanded set", () => {
		const { result } = renderHook(() => useNavigationItem("a"));
		expect(result.current.open).toBe(false);

		act(() => result.current.toggleExpanded("a", true));
		expect(result.current.open).toBe(true);

		act(() => result.current.toggleExpanded("a", false));
		expect(result.current.open).toBe(false);
	});

	test("isSelected follows the selected id", () => {
		const { result } = renderHook(() => useNavigationItem("a/b"));
		expect(result.current.isSelected).toBe(false);

		act(() => result.current.select("a/b"));
		expect(result.current.isSelected).toBe(true);
	});

	test("selecting another item deselects this one", () => {
		const { result } = renderHook(() => useNavigationItem("a/b"));
		act(() => navigationTreeStore.getState().select("a/b"));
		expect(result.current.isSelected).toBe(true);

		act(() => navigationTreeStore.getState().select("a/c"));
		expect(result.current.isSelected).toBe(false);
	});
});
