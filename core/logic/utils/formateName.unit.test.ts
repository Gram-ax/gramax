import formateName from "./formateName";

describe("formateName", () => {
	test("returns original name when no options are enabled", () => {
		expect(formateName("demo-ges workspace")).toBe("demo-ges workspace");
	});

	test("replaces spaces with non-breaking spaces when enabled", () => {
		expect(formateName("demo ges workspace", { replaceSpacesWithNonBreaking: true })).toBe(
			"demo\u00A0ges\u00A0workspace",
		);
	});

	test("replaces hyphens with non-breaking hyphens when enabled", () => {
		expect(formateName("demo-ges-workspace", { replaceHyphensWithNonBreaking: true })).toBe(
			"demo\u2011ges\u2011workspace",
		);
	});

	test("replaces both spaces and hyphens when both options are enabled", () => {
		expect(
			formateName("demo-ges workspace", {
				replaceHyphensWithNonBreaking: true,
				replaceSpacesWithNonBreaking: true,
			}),
		).toBe("demo\u2011ges\u00A0workspace");
	});
});
