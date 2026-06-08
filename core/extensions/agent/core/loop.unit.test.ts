import { buildSimpleLineDiff, parseLineRangeArgs, readCatalogToolDataToMarkdown, readLineRange } from "./loop";

describe("readCatalogToolDataToMarkdown", () => {
	test("returns null for non-object input", () => {
		expect(readCatalogToolDataToMarkdown(null)).toBeNull();
		expect(readCatalogToolDataToMarkdown(undefined)).toBeNull();
		expect(readCatalogToolDataToMarkdown("x")).toBeNull();
		expect(readCatalogToolDataToMarkdown(1)).toBeNull();
	});

	test("returns string content as-is", () => {
		const content = ["# Title", "", "Paragraph one.", "  indented", ""].join("\n");
		expect(readCatalogToolDataToMarkdown({ content })).toBe(content);
	});

	test("joins lines array second columns when no content string", () => {
		expect(
			readCatalogToolDataToMarkdown({
				lines: [
					[1, "a"],
					[2, "b"],
				] as [number, string][],
			}),
		).toBe("a\nb");
	});

	test("returns null when object has neither content nor lines array", () => {
		expect(readCatalogToolDataToMarkdown({})).toBeNull();
		expect(readCatalogToolDataToMarkdown({ lines: "not-array" })).toBeNull();
	});

	test("returns empty string for empty lines array", () => {
		expect(readCatalogToolDataToMarkdown({ lines: [] })).toBe("");
	});
});

describe("parseLineRangeArgs", () => {
	test("returns empty object when both bounds omitted", () => {
		expect(parseLineRangeArgs({})).toEqual({});
	});

	test("returns range when both are integers", () => {
		expect(parseLineRangeArgs({ lineStart: 2, lineEnd: 5 })).toEqual({ lineStart: 2, lineEnd: 5 });
	});

	test("returns null when only one bound is set", () => {
		expect(parseLineRangeArgs({ lineStart: 1 })).toBeNull();
		expect(parseLineRangeArgs({ lineEnd: 3 })).toBeNull();
	});

	test("returns null when types are not number", () => {
		expect(parseLineRangeArgs({ lineStart: "1", lineEnd: 2 })).toBeNull();
		expect(parseLineRangeArgs({ lineStart: 1, lineEnd: "2" })).toBeNull();
	});
});

describe("readLineRange", () => {
	test("returns empty when lineEnd is before lineStart", () => {
		expect(readLineRange("a\nb", 3, 1)).toBe("");
	});

	test("returns empty when range is outside existing lines", () => {
		expect(readLineRange("only", 2, 3)).toBe("");
	});

	test("returns single line slice", () => {
		expect(readLineRange("first\nsecond\nthird", 2, 2)).toBe("second");
	});

	test("returns inclusive multi-line slice", () => {
		expect(readLineRange("a\nb\nc\nd", 2, 3)).toBe("b\nc");
	});

	test("clips start to line 1 and end to last line", () => {
		expect(readLineRange("x\ny", 0, 99)).toBe("x\ny");
	});
});

describe("buildSimpleLineDiff", () => {
	test("returns empty array for identical strings", () => {
		expect(buildSimpleLineDiff("same\nlines", "same\nlines")).toEqual([]);
	});

	test("returns one diff block for trailing line change", () => {
		expect(buildSimpleLineDiff("keep\nold", "keep\nnew")).toEqual([
			{
				lineStart: 2,
				lineCount: 1,
				beforeText: "old",
				afterText: "new",
			},
		]);
	});

	test("returns one block when strings are completely different", () => {
		expect(buildSimpleLineDiff("x", "y")).toEqual([
			{
				lineStart: 1,
				lineCount: 1,
				beforeText: "x",
				afterText: "y",
			},
		]);
	});

	test("handles insertion at start", () => {
		expect(buildSimpleLineDiff("mid\nend", "new\nmid\nend")).toEqual([
			{
				lineStart: 1,
				lineCount: 0,
				beforeText: "",
				afterText: "new",
			},
		]);
	});
});
