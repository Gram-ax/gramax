import { SIDEBAR_MENU_SUB_INDENT } from "./constants";
import { getIndicatorOffset } from "./getIndicatorOffset";

describe("getIndicatorOffset", () => {
	test("root level needs no compensation", () => {
		expect(getIndicatorOffset(1)).toBe("0px");
	});

	test("pulls back by one indent per nesting level", () => {
		expect(getIndicatorOffset(2)).toBe(`${-SIDEBAR_MENU_SUB_INDENT}px`);
		expect(getIndicatorOffset(3)).toBe(`${-2 * SIDEBAR_MENU_SUB_INDENT}px`);
		expect(getIndicatorOffset(5)).toBe(`${-4 * SIDEBAR_MENU_SUB_INDENT}px`);
	});
});
