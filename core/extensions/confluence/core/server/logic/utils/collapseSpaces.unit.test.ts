import { collapseSpaces } from "@ext/confluence/core/server/logic/utils/collapseSpaces";

describe("collapseSpaces", () => {
	test("collapses two or more sequential spaces into one", () => {
		const value = "alpha    beta  gamma";

		expect(collapseSpaces(value)).toBe("alpha beta gamma");
	});

	test("preserves existing single spaces", () => {
		const value = "delta epsilon";

		expect(collapseSpaces(value)).toBe("delta epsilon");
	});

	test("converts non-breaking spaces to regular spaces", () => {
		const value = `zeta\u00A0\u00A0eta`;

		expect(collapseSpaces(value)).toBe("zeta eta");
	});

	test("collapses mixed non-breaking and regular spaces", () => {
		const value = `theta\u00A0  iota`;

		expect(collapseSpaces(value)).toBe("theta iota");
	});
});
