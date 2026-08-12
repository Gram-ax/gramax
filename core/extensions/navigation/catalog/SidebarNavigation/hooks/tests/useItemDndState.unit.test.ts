import { useDraggable, useDroppable } from "@dnd-kit/core";
import { act, renderHook } from "@testing-library/react";
import type { DragTarget } from "../../store/navigationTreeStore";
import { navigationTreeStore } from "../../store/navigationTreeStore";
import { DropMode } from "../../utils/dropMode";
import { firstSlotId, lastSlotId } from "../../utils/groupSlotId";
import { useItemDndState } from "../useItemDndState";
import { link, resetNavigationTreeStore, seedTree } from "./navigationTreeStoreTestUtils";

// dnd-kit's hooks need a surrounding DndContext, which this suite is not exercising — it only asserts what
// the hook derives from the store and what it forwards from dnd-kit.
jest.mock("@dnd-kit/core", () => ({
	useDroppable: jest.fn(() => ({ setNodeRef: jest.fn() })),
	useDraggable: jest.fn(() => ({
		attributes: { role: "button" },
		listeners: { onPointerDown: jest.fn() },
		setNodeRef: jest.fn(),
	})),
}));

const mockUseDraggable = useDraggable as jest.MockedFunction<typeof useDraggable>;
const mockUseDroppable = useDroppable as jest.MockedFunction<typeof useDroppable>;

const setDragTarget = (target: DragTarget) => act(() => navigationTreeStore.getState().setDragTarget(target));

beforeEach(() => {
	jest.clearAllMocks();
	resetNavigationTreeStore();
	seedTree([link("root", [link("root/a"), link("root/b")])]);
});

describe("useItemDndState", () => {
	test("does not subscribe to dnd-kit context", () => {
		renderHook(() => useItemDndState("root/a"));

		expect(mockUseDroppable).not.toHaveBeenCalled();
		expect(mockUseDraggable).not.toHaveBeenCalled();
	});

	test("disables dragging while the tree is locked", () => {
		act(() => navigationTreeStore.getState().setDragLocked(true));

		const { result } = renderHook(() => useItemDndState("root/a"));

		expect(result.current.isDragLocked).toBe(true);
	});

	test("isDragging tracks only the item being dragged", () => {
		const dragged = renderHook(() => useItemDndState("root/a"));
		const other = renderHook(() => useItemDndState("root/b"));

		act(() => navigationTreeStore.getState().setDragging("root/a"));

		expect(dragged.result.current.isDragging).toBe(true);
		expect(other.result.current.isDragging).toBe(false);
	});

	test("isInsertionTarget follows the hovered parent", () => {
		const { result } = renderHook(() => useItemDndState("root"));
		expect(result.current.isInsertionTarget).toBe(false);

		act(() => navigationTreeStore.getState().setHover("root", "root/a"));

		expect(result.current.isInsertionTarget).toBe(true);
	});

	test("an `into` drop highlights the anchor", () => {
		const { result } = renderHook(() => useItemDndState("root/a"));

		setDragTarget({ anchorId: "root/a", parentId: null, mode: DropMode.Into });

		expect(result.current.isDragTarget).toBe(true);
		expect(result.current.dropMode).toBe(DropMode.Into);
		expect(result.current.showsDragLine).toBe(false);
		expect(result.current.isDragAnchor).toBe(false);
	});

	test("an `after` drop highlights the receiving parent, not the anchor", () => {
		const anchor = renderHook(() => useItemDndState("root/a"));
		const parent = renderHook(() => useItemDndState("root"));

		setDragTarget({ anchorId: "root/a", parentId: "root", mode: DropMode.After });

		// the anchor only draws the line; the parent is the container the item lands in
		expect(anchor.result.current.isDragTarget).toBe(false);
		expect(anchor.result.current.dropMode).toBe(DropMode.After);
		expect(parent.result.current.isDragTarget).toBe(true);
	});

	test("an `after` drop exposes the drag line and its anchor", () => {
		const above = renderHook(() => useItemDndState("root/a"));
		const anchor = renderHook(() => useItemDndState("root/b"));

		setDragTarget({ anchorId: "root/b", parentId: "root", mode: DropMode.After });

		expect(above.result.current.showsDragLine).toBe(true);
		expect(above.result.current.isDragAnchor).toBe(false);
		expect(anchor.result.current.showsDragLine).toBe(true);
		expect(anchor.result.current.isDragAnchor).toBe(true);
	});

	test("a parentless `after` target flags only the anchor", () => {
		const { result } = renderHook(() => useItemDndState("root"));

		setDragTarget({ anchorId: "root", parentId: null, mode: DropMode.After });

		expect(result.current.showsDragLine).toBe(false);
		expect(result.current.isDragAnchor).toBe(true);
	});

	test("a first-child slot highlights both the slot anchor and its group", () => {
		const slot = renderHook(() => useItemDndState(firstSlotId("root")));
		const group = renderHook(() => useItemDndState("root"));

		setDragTarget({ anchorId: firstSlotId("root"), parentId: "root", mode: DropMode.FirstChild });

		expect(slot.result.current.isDragTarget).toBe(true);
		expect(group.result.current.isDragTarget).toBe(true);
	});

	test("a last-child slot highlights its group but not the slot anchor itself", () => {
		const slot = renderHook(() => useItemDndState(lastSlotId("root")));
		const group = renderHook(() => useItemDndState("root"));

		setDragTarget({ anchorId: lastSlotId("root"), parentId: "root", mode: DropMode.LastChild });

		expect(slot.result.current.isDragTarget).toBe(false);
		expect(group.result.current.isDragTarget).toBe(true);
	});

	test("dropMode is false for items that are not the anchor", () => {
		const { result } = renderHook(() => useItemDndState("root/b"));

		setDragTarget({ anchorId: "root/a", parentId: "root", mode: DropMode.After });

		expect(result.current.dropMode).toBe(false);
	});
});
