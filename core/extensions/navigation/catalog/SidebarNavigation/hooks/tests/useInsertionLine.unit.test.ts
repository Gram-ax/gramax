import { act, renderHook } from "@testing-library/react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { INSERTION_BUTTON_SIZE } from "../../utils/constants";
import { iconLeft } from "../../utils/sidebarInsertionLineUtils";
import { useInsertionLine } from "../useInsertionLine";

const ROW_LEFT = 100;

/** Fakes a mousemove at `offsetX` px from the row's left edge, the only geometry the hook reads. */
const mouseMoveAt = (offsetX: number) =>
	({
		clientX: ROW_LEFT + offsetX,
		currentTarget: { getBoundingClientRect: () => ({ left: ROW_LEFT }) },
	}) as unknown as ReactMouseEvent<HTMLDivElement>;

const render = (overrides: Partial<Parameters<typeof useInsertionLine>[0]> = {}) =>
	renderHook((props: Parameters<typeof useInsertionLine>[0]) => useInsertionLine(props), {
		initialProps: { minDepth: 1, maxDepth: 3, levelOffset: 0, ...overrides },
	});

describe("useInsertionLine", () => {
	test("renders one item per depth in the allowed range", () => {
		const { result } = render({ minDepth: 2, maxDepth: 4 });

		expect(result.current.items.map((i) => i.depth)).toEqual([2, 3, 4]);
	});

	test("hides every icon until the pointer enters the row", () => {
		const { result } = render();

		expect(result.current.items.every((i) => i.isHidden)).toBe(true);
		expect(result.current.isTailSolid).toBe(false);
		expect(result.current.clickableDepth).toBeNull();
	});

	test("the tail rests at the deepest depth before any hover", () => {
		const { result } = render({ maxDepth: 3 });

		expect(result.current.tailLeft).toBe(iconLeft(3, 0) + INSERTION_BUTTON_SIZE);
	});

	test("hovering a depth reveals it and everything shallower, hiding the rest", () => {
		const { result } = render();

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(2))));

		const [d1, d2, d3] = result.current.items;
		expect(d1.isHidden).toBe(false);
		expect(d2.isHidden).toBe(false);
		expect(d3.isHidden).toBe(true);
	});

	test("only the hovered depth is active; shallower ones are placeholders", () => {
		const { result } = render();

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(2))));

		const [d1, d2, d3] = result.current.items;
		expect(d1.isPlaceholder).toBe(true);
		expect(d1.isActive).toBe(false);
		expect(d2.isPlaceholder).toBe(false);
		expect(d2.isActive).toBe(true);
		expect(d3.isActive).toBe(false);
	});

	test("the tail follows the hovered depth and turns solid", () => {
		const { result } = render();

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(2))));

		expect(result.current.tailLeft).toBe(iconLeft(2, 0) + INSERTION_BUTTON_SIZE);
		expect(result.current.isTailSolid).toBe(true);
		expect(result.current.clickableDepth).toBe(2);
	});

	test("hovering past the last icon parks on the tail — deepest depth, nothing clickable", () => {
		const { result } = render({ maxDepth: 3 });

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(3) + INSERTION_BUTTON_SIZE + 20)));

		expect(result.current.items.every((i) => !i.isActive)).toBe(true);
		expect(result.current.isTailSolid).toBe(false);
		expect(result.current.clickableDepth).toBeNull();
		expect(result.current.tailLeft).toBe(iconLeft(3, 0) + INSERTION_BUTTON_SIZE);
	});

	test("connectors link each icon to the one before it; the first has none", () => {
		const { result } = render({ minDepth: 1, maxDepth: 3 });

		const [d1, d2, d3] = result.current.items;
		expect(d1.connectorLeft).toBeNull();
		expect(d2.connectorLeft).toBe(iconLeft(1, 0) + INSERTION_BUTTON_SIZE);
		expect(d3.connectorLeft).toBe(iconLeft(2, 0) + INSERTION_BUTTON_SIZE);
	});

	test("icon positions honour levelOffset", () => {
		const { result } = render({ minDepth: 3, maxDepth: 4, levelOffset: 2 });

		expect(result.current.items.map((i) => i.iconLeft)).toEqual([iconLeft(3, 2), iconLeft(4, 2)]);
	});

	test("reports the hovered depth to the parent, and null while on the tail", () => {
		const onParentHover = jest.fn();
		const { result } = render({ maxDepth: 3, onParentHover });

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(2))));
		expect(onParentHover).toHaveBeenLastCalledWith(2);

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(3) + INSERTION_BUTTON_SIZE + 20)));
		expect(onParentHover).toHaveBeenLastCalledWith(null);
	});

	test("leaving the row resets every derived flag and clears the parent hover", () => {
		const onParentHover = jest.fn();
		const { result } = render({ onParentHover });
		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(2))));

		act(() => result.current.handleMouseLeave());

		expect(result.current.items.every((i) => i.isHidden)).toBe(true);
		expect(result.current.clickableDepth).toBeNull();
		expect(result.current.isTailSolid).toBe(false);
		expect(onParentHover).toHaveBeenLastCalledWith(null);
	});

	test("clamps the hover to the allowed range", () => {
		const { result } = render({ minDepth: 2, maxDepth: 3 });

		act(() => result.current.handleMouseMove(mouseMoveAt(-500)));
		expect(result.current.clickableDepth).toBe(2);

		act(() => result.current.handleMouseMove(mouseMoveAt(iconLeft(3))));
		expect(result.current.clickableDepth).toBe(3);
	});
});
