import { isResettable } from "./settingResetVisible";

describe("isResettable", () => {
	it("false when value equals default", () => {
		expect(isResettable("ru", "ru")).toBe(false);
	});
	it("true when value differs from default", () => {
		expect(isResettable("en", "ru")).toBe(true);
	});
	it("false when both empty-ish", () => {
		expect(isResettable("", "")).toBe(false);
		expect(isResettable("", undefined)).toBe(false);
	});
	it("true when empty value but a non-empty default exists", () => {
		expect(isResettable("", "https://app.gram.ax")).toBe(true);
	});
	it("compares arrays structurally", () => {
		expect(isResettable([1, 2], [1, 2])).toBe(false);
		expect(isResettable([1, 2], [1])).toBe(true);
	});
});
