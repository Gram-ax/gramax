import { INSERTION_BUTTON_SIZE, SIDEBAR_MENU_SUB_INDENT } from "./constants";
import { depthFromMouseX, iconLeft } from "./sidebarInsertionLineUtils";

describe("iconLeft", () => {
	test("centers the icon on the indent line of its depth", () => {
		// depth 1 sits on the level-1 indent line (x = 0), so the icon starts half its width to the left
		expect(iconLeft(1)).toBe(-INSERTION_BUTTON_SIZE / 2 + 0.5);
		expect(iconLeft(2)).toBe(10.5);
		expect(iconLeft(3)).toBe(2 * SIDEBAR_MENU_SUB_INDENT - INSERTION_BUTTON_SIZE / 2 + 0.5);
	});

	test("levelOffset rebases depth onto the container's own origin", () => {
		// inside a level-2 container, depth 3 renders where depth 1 would in a level-0 container
		expect(iconLeft(3, 2)).toBe(iconLeft(1, 0));
		expect(iconLeft(4, 2)).toBe(iconLeft(2, 0));
	});
});

describe("depthFromMouseX", () => {
	const minDepth = 1;
	const maxDepth = 4;

	const depthAt = (offsetX: number) => depthFromMouseX(offsetX, maxDepth, minDepth);

	test("the left edge of the row maps to the shallowest depth", () => {
		expect(depthAt(0)).toBe(1);
	});

	test("each icon's own left edge already reads as its depth", () => {
		// the hit zone starts at the icon, so hovering exactly on it must not still report the depth before it
		expect(depthAt(iconLeft(2))).toBe(2);
		expect(depthAt(iconLeft(3))).toBe(3);
	});

	test("depth increments at the left edge of the next icon, not before", () => {
		const boundary = iconLeft(3);
		expect(depthAt(boundary - 1)).toBe(2);
		expect(depthAt(boundary)).toBe(3);
	});

	test("clamps below minDepth", () => {
		expect(depthFromMouseX(-500, maxDepth, 2)).toBe(2);
	});

	test("clamps above maxDepth", () => {
		expect(depthAt(10_000)).toBe(maxDepth);
	});

	test("clamping to a single allowed depth pins every x to it", () => {
		expect(depthFromMouseX(0, 3, 3)).toBe(3);
		expect(depthFromMouseX(9999, 3, 3)).toBe(3);
	});

	test("levelOffset shifts the reported depth by the container's own level", () => {
		expect(depthFromMouseX(0, 6, 1, 2)).toBe(3);
		expect(depthFromMouseX(iconLeft(1), 6, 1, 2)).toBe(3);
	});

	test("round-trips with iconLeft across the whole range", () => {
		for (let depth = minDepth; depth <= maxDepth; depth++) {
			expect(depthAt(iconLeft(depth))).toBe(depth);
		}
	});
});
