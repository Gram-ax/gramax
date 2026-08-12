import { getNavigationAutoScrollDelta } from "./navigationAutoScroll";

describe("getNavigationAutoScrollDelta", () => {
	const viewport = { top: 100, bottom: 500 };

	test("does not scroll outside the edge zones", () => {
		expect(getNavigationAutoScrollDelta(200, viewport)).toBe(0);
		expect(getNavigationAutoScrollDelta(400, viewport)).toBe(0);
	});

	test("scrolls upward and accelerates toward the top edge", () => {
		expect(getNavigationAutoScrollDelta(175, viewport)).toBe(-8);
		expect(getNavigationAutoScrollDelta(100, viewport)).toBe(-32);
		expect(getNavigationAutoScrollDelta(50, viewport)).toBe(-32);
	});

	test("scrolls downward and accelerates toward the bottom edge", () => {
		expect(getNavigationAutoScrollDelta(425, viewport)).toBe(8);
		expect(getNavigationAutoScrollDelta(500, viewport)).toBe(32);
		expect(getNavigationAutoScrollDelta(550, viewport)).toBe(32);
	});
});
