import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import { navigationTreeStore } from "../../store/navigationTreeStore";
import { beforeItemSlotId } from "../../utils/beforeItemSlot";
import { AUTO_EXPAND_DELAY_MS, DROP_AFTER_ZONE_PX } from "../../utils/constants";
import { DropMode } from "../../utils/dropMode";
import { firstSlotId, lastSlotId } from "../../utils/groupSlotId";
import { useNavigationDnd } from "../useNavigationDnd";
import { link, resetNavigationTreeStore, seedTree } from "./navigationTreeStoreTestUtils";

// The sensors are dnd-kit's own machinery; this suite drives the drag callbacks directly instead.
jest.mock("@dnd-kit/core", () => ({
	PointerSensor: jest.fn(),
	useSensor: jest.fn(() => ({})),
	useSensors: jest.fn((...sensors) => sensors),
}));

const CONTAINER_BOTTOM = 400;
const ROW_TOP = 100;
const ROW_HEIGHT = 40;

const containerRef = () => {
	const el = document.createElement("div");
	el.getBoundingClientRect = () => ({ bottom: CONTAINER_BOTTOM }) as DOMRect;
	return { current: el } as RefObject<HTMLDivElement>;
};

const overRow = (id: string) => ({ id, rect: { top: ROW_TOP, height: ROW_HEIGHT } });

/** dnd-kit reports the pointer through a window listener, not the event — the hook reads it from there. */
const movePointerTo = (clientY: number) =>
	act(() => {
		const event = new Event("pointermove") as PointerEvent;
		Object.assign(event, { clientY });
		window.dispatchEvent(event);
	});

const onDrop = jest.fn();

const render = () => {
	const { result } = renderHook(() => useNavigationDnd(containerRef()));
	return result;
};

const dragMove = (result: ReturnType<typeof render>, active: string, over: ReturnType<typeof overRow> | null) =>
	act(() => result.current.onDragMove({ active: { id: active }, over } as unknown as DragMoveEvent));

const dragEnd = (result: ReturnType<typeof render>, active: string) =>
	act(() => result.current.onDragEnd({ active: { id: active } } as unknown as DragEndEvent));

const store = () => navigationTreeStore.getState();

/**
 * group (root)
 *  ├─ folder
 *  │   └─ child
 *  └─ leaf
 */
const seedGroup = () => seedTree([link("group", [link("folder", [link("child")]), link("leaf")])]);

beforeEach(() => {
	jest.useFakeTimers();
	jest.clearAllMocks();
	resetNavigationTreeStore();
	seedGroup();
	store().setOnDrop(onDrop);
});

afterEach(() => {
	jest.useRealTimers();
});

describe("onDragStart", () => {
	test("marks the item as being dragged", () => {
		const result = render();

		act(() => result.current.onDragStart({ active: { id: "leaf" } } as unknown as DragStartEvent));

		expect(store().draggingId).toBe("leaf");
	});
});

describe("onDragMove over an item", () => {
	test("the explicit boundary above an item resolves to that item", () => {
		const result = render();

		dragMove(result, "leaf", overRow(beforeItemSlotId("folder")));

		expect(store().dragTarget).toEqual({ anchorId: "folder", parentId: "group", mode: DropMode.Before });
	});

	test("the top strip of a row means `before`, and carries the anchor's parent", () => {
		const result = render();
		movePointerTo(ROW_TOP + 1);

		dragMove(result, "leaf", overRow("folder"));

		expect(store().dragTarget).toEqual({ anchorId: "folder", parentId: "group", mode: DropMode.Before });
	});

	test("uses the live pointer coordinate when the drag delta is offset", () => {
		const result = render();
		movePointerTo(ROW_TOP + 20);
		const activatorEvent = Object.assign(new Event("pointerdown"), { clientY: ROW_TOP });

		act(() =>
			result.current.onDragMove({
				active: { id: "leaf" },
				activatorEvent,
				delta: { x: 0, y: 1 },
				over: overRow("folder"),
			} as unknown as DragMoveEvent),
		);

		expect(store().dragTarget).toEqual({ anchorId: "folder", parentId: null, mode: DropMode.Into });
	});

	test("falls back to the drag event coordinate before the first pointer move", () => {
		const result = render();
		const activatorEvent = Object.assign(new Event("pointerdown"), { clientY: ROW_TOP });

		act(() =>
			result.current.onDragMove({
				active: { id: "leaf" },
				activatorEvent,
				delta: { x: 0, y: 1 },
				over: overRow("folder"),
			} as unknown as DragMoveEvent),
		);

		expect(store().dragTarget).toEqual({ anchorId: "folder", parentId: "group", mode: DropMode.Before });
	});

	test("the middle of a row means `into`", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "leaf", overRow("folder"));

		expect(store().dragTarget).toEqual({ anchorId: "folder", parentId: null, mode: DropMode.Into });
	});

	test("the bottom strip of a row means `after`, and carries the anchor's parent", () => {
		const result = render();
		movePointerTo(ROW_TOP + ROW_HEIGHT - DROP_AFTER_ZONE_PX);

		dragMove(result, "leaf", overRow("folder"));

		expect(store().dragTarget).toEqual({ anchorId: "folder", parentId: "group", mode: DropMode.After });
	});

	test("dropping onto itself is rejected", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "folder", overRow("folder"));

		expect(store().dragTarget).toBeNull();
	});

	test("dropping a folder into its own descendant is rejected", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "folder", overRow("child"));

		expect(store().dragTarget).toBeNull();
	});
});

describe("onDragMove auto-expand", () => {
	test("hovering `into` a collapsed folder with children expands it after the delay", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "leaf", overRow("folder"));
		expect(store().expanded.has("folder")).toBe(false);

		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(store().expanded.has("folder")).toBe(true);
	});

	test("leaving the folder before the delay elapses cancels the expand", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);
		dragMove(result, "leaf", overRow("folder"));

		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS - 1));
		dragMove(result, "leaf", null);
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(store().expanded.has("folder")).toBe(false);
	});

	test("staying on the same folder does not restart the timer", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "leaf", overRow("folder"));
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS - 10));
		// a re-fired move on the same target must not push the expand another full delay out
		dragMove(result, "leaf", overRow("folder"));
		act(() => jest.advanceTimersByTime(10));

		expect(store().expanded.has("folder")).toBe(true);
	});

	test("an `after` hover never expands", () => {
		const result = render();
		movePointerTo(ROW_TOP + ROW_HEIGHT - DROP_AFTER_ZONE_PX);

		dragMove(result, "leaf", overRow("folder"));
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(store().expanded.has("folder")).toBe(false);
	});

	test("a childless item never expands", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "folder", overRow("leaf"));
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(store().expanded.has("leaf")).toBe(false);
	});

	test("an already open folder is left alone", () => {
		const result = render();
		act(() => store().toggleExpanded("folder", true));
		const onToggle = jest.fn();
		store().setOnToggle(onToggle);
		movePointerTo(ROW_TOP + 5);

		dragMove(result, "leaf", overRow("folder"));
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(onToggle).not.toHaveBeenCalled();
	});
});

describe("onDragMove over a group slot", () => {
	test("the first slot targets the top of the group", () => {
		const result = render();

		dragMove(result, "leaf", overRow(firstSlotId("group")));

		expect(store().dragTarget).toEqual({
			anchorId: firstSlotId("group"),
			parentId: "group",
			mode: DropMode.FirstChild,
		});
	});

	test("the last slot targets the bottom of the group", () => {
		const result = render();

		dragMove(result, "leaf", overRow(lastSlotId("group")));

		expect(store().dragTarget).toEqual({
			anchorId: lastSlotId("group"),
			parentId: "group",
			mode: DropMode.LastChild,
		});
	});

	test("a slot of the dragged item's own group is rejected", () => {
		const result = render();

		dragMove(result, "group", overRow(firstSlotId("group")));

		expect(store().dragTarget).toBeNull();
	});

	test("hovering a slot cancels a pending auto-expand", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);
		dragMove(result, "leaf", overRow("folder"));

		dragMove(result, "leaf", overRow(lastSlotId("group")));
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(store().expanded.has("folder")).toBe(false);
	});
});

describe("onDragMove with no drop target", () => {
	test("below the container, the item targets the root level after the last group", () => {
		const result = render();
		movePointerTo(CONTAINER_BOTTOM + 10);

		dragMove(result, "leaf", null);

		expect(store().dragTarget).toEqual({
			anchorId: lastSlotId("group"),
			parentId: null,
			mode: DropMode.LastRoot,
		});
	});

	test("dragging the last group itself below the container targets nothing", () => {
		const result = render();
		movePointerTo(CONTAINER_BOTTOM + 10);

		dragMove(result, "group", null);

		expect(store().dragTarget).toBeNull();
	});

	test("inside the container but over nothing, the target is cleared", () => {
		const result = render();
		movePointerTo(ROW_TOP);

		dragMove(result, "leaf", null);

		expect(store().dragTarget).toBeNull();
	});
});

describe("onDragEnd", () => {
	test("a drop below the container becomes an `after` on the last root item", () => {
		const result = render();
		movePointerTo(CONTAINER_BOTTOM + 10);
		dragMove(result, "leaf", null);

		dragEnd(result, "leaf");

		expect(onDrop).toHaveBeenCalledWith("leaf", "group", DropMode.After);
	});

	test("commits a `before` drop as-is", () => {
		const result = render();
		movePointerTo(ROW_TOP + 1);
		dragMove(result, "leaf", overRow("folder"));

		dragEnd(result, "leaf");

		expect(onDrop).toHaveBeenCalledWith("leaf", "folder", DropMode.Before);
	});

	test("commits an `after` drop as-is", () => {
		const result = render();
		movePointerTo(ROW_TOP + ROW_HEIGHT - DROP_AFTER_ZONE_PX);
		dragMove(result, "leaf", overRow("folder"));

		dragEnd(result, "leaf");

		expect(onDrop).toHaveBeenCalledWith("leaf", "folder", DropMode.After);
	});

	test("commits an `into` drop as-is", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);
		dragMove(result, "leaf", overRow("folder"));

		dragEnd(result, "leaf");

		expect(onDrop).toHaveBeenCalledWith("leaf", "folder", DropMode.Into);
	});

	test("a first-child drop becomes an `into` on the group", () => {
		const result = render();
		dragMove(result, "leaf", overRow(firstSlotId("group")));

		dragEnd(result, "leaf");

		expect(onDrop).toHaveBeenCalledWith("leaf", "group", DropMode.Into);
	});

	test("a last-child drop becomes an `after` on the group's current last child", () => {
		const result = render();
		dragMove(result, "folder", overRow(lastSlotId("group")));

		dragEnd(result, "folder");

		expect(onDrop).toHaveBeenCalledWith("folder", "leaf", DropMode.After);
	});

	test("a last-child drop ignores the dragged item when picking the last child", () => {
		const result = render();
		// `leaf` is already the last child — anchoring after itself would be a no-op, so `folder` is used
		dragMove(result, "leaf", overRow(lastSlotId("group")));

		dragEnd(result, "leaf");

		expect(onDrop).toHaveBeenCalledWith("leaf", "folder", DropMode.After);
	});

	test("a last-child drop into an empty group falls back to an `into`", () => {
		seedTree([link("group"), link("other", [link("x")])]);
		const result = render();
		dragMove(result, "x", overRow(lastSlotId("group")));

		dragEnd(result, "x");

		expect(onDrop).toHaveBeenCalledWith("x", "group", DropMode.Into);
	});

	test("ending without a target drops nothing", () => {
		const result = render();

		dragEnd(result, "leaf");

		expect(onDrop).not.toHaveBeenCalled();
	});

	test("clears the drag state and cancels a pending auto-expand", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);
		act(() => result.current.onDragStart({ active: { id: "leaf" } } as unknown as DragStartEvent));
		dragMove(result, "leaf", overRow("folder"));

		dragEnd(result, "leaf");
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(store().draggingId).toBeNull();
		expect(store().dragTarget).toBeNull();
		expect(store().expanded.has("folder")).toBe(false);
	});
});

describe("onDragCancel", () => {
	test("clears the drag state without dropping", () => {
		const result = render();
		movePointerTo(ROW_TOP + 5);
		act(() => result.current.onDragStart({ active: { id: "leaf" } } as unknown as DragStartEvent));
		dragMove(result, "leaf", overRow("folder"));

		act(() => result.current.onDragCancel());
		act(() => jest.advanceTimersByTime(AUTO_EXPAND_DELAY_MS));

		expect(onDrop).not.toHaveBeenCalled();
		expect(store().draggingId).toBeNull();
		expect(store().dragTarget).toBeNull();
		expect(store().expanded.has("folder")).toBe(false);
	});
});
