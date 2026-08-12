import parsePixels from "@core-ui/utils/parsePixels";

describe("parsePixels", () => {
	test.each([
		["0px", 0],
		["12px", 12],
		["12.5px", 12.5],
	])("parses %s", (width, expected) => {
		expect(parsePixels(width)).toBe(expected);
	});

	test.each(["12", "12em", "12 px", "-12px", ".5px", "px", ""])("returns null for %s", (width) => {
		expect(parsePixels(width)).toBeNull();
	});
});
