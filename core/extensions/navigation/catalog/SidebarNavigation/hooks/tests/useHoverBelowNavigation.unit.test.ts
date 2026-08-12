import { act, renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import { AFTER_CONTAINER_HOVER_OFFSET_PX } from "../../utils/constants";
import { useHoverBelowNavigation } from "../useHoverBelowNavigation";

type Rect = { top: number; bottom: number; left: number; right: number };

const PANEL: Rect = { top: 0, bottom: 500, left: 0, right: 200 };
const CONTAINER: Rect = { top: 0, bottom: 300, left: 0, right: 200 };

/** The container is the item list; the panel is the sidebar it sits in — the hook needs both rects. */
const mountRef = (container: Rect = CONTAINER, panel: Rect = PANEL) => {
	const panelEl = document.createElement("div");
	panelEl.className = "left-navigation-content";
	panelEl.getBoundingClientRect = () => panel as DOMRect;

	const containerEl = document.createElement("div");
	containerEl.getBoundingClientRect = () => container as DOMRect;

	panelEl.append(containerEl);
	document.body.append(panelEl);

	return { current: containerEl } as RefObject<HTMLDivElement>;
};

const pointerAt = (clientX: number, clientY: number) =>
	act(() => {
		const event = new Event("pointermove") as PointerEvent;
		Object.assign(event, { clientX, clientY });
		window.dispatchEvent(event);
	});

afterEach(() => {
	document.body.innerHTML = "";
});

describe("useHoverBelowNavigation", () => {
	test("starts inactive", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		expect(result.current.isHoverBelow).toBe(false);
	});

	test("activates in the empty space between the list and the bottom of the panel", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		pointerAt(100, 400);

		expect(result.current.isHoverBelow).toBe(true);
	});

	test("stays inactive over the list itself", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		pointerAt(100, 150);

		expect(result.current.isHoverBelow).toBe(false);
	});

	test("needs a gap below the list before it triggers", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		pointerAt(100, CONTAINER.bottom + AFTER_CONTAINER_HOVER_OFFSET_PX - 1);
		expect(result.current.isHoverBelow).toBe(false);

		pointerAt(100, CONTAINER.bottom + AFTER_CONTAINER_HOVER_OFFSET_PX);
		expect(result.current.isHoverBelow).toBe(true);
	});

	test("stays active at the top edge of the insertion button", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		pointerAt(100, CONTAINER.bottom + 8);

		expect(result.current.isHoverBelow).toBe(true);
	});

	test("stays inactive below the panel", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		pointerAt(100, PANEL.bottom + 1);

		expect(result.current.isHoverBelow).toBe(false);
	});

	test("stays inactive left or right of the panel", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));

		pointerAt(PANEL.left - 1, 400);
		expect(result.current.isHoverBelow).toBe(false);

		pointerAt(PANEL.right + 1, 400);
		expect(result.current.isHoverBelow).toBe(false);
	});

	test("deactivates when the pointer moves back onto the list", () => {
		const { result } = renderHook(() => useHoverBelowNavigation(mountRef()));
		pointerAt(100, 400);
		expect(result.current.isHoverBelow).toBe(true);

		pointerAt(100, 150);

		expect(result.current.isHoverBelow).toBe(false);
	});

	test("stops listening once unmounted", () => {
		const remove = jest.spyOn(window, "removeEventListener");
		const { unmount } = renderHook(() => useHoverBelowNavigation(mountRef()));

		unmount();

		expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
		remove.mockRestore();
	});
});
