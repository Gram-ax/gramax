/**
 * @jest-environment node
 */
import {
	DEFAULT_EXPANDED_DEPTH,
	entriesOf,
	isContainer,
	isCopyableLeaf,
	isDefaultOpen,
	resolveValue,
	SMALL_CONTAINER_THRESHOLD,
	toCopyText,
} from "./toolPayloadUtils";

describe("resolveValue", () => {
	test("passes through non-string values unchanged", () => {
		expect(resolveValue(42)).toBe(42);
		expect(resolveValue(null)).toBe(null);
		expect(resolveValue(true)).toBe(true);
	});

	test("passes through a plain string that is not JSON", () => {
		expect(resolveValue("hello")).toBe("hello");
		expect(resolveValue("  some text")).toBe("  some text");
	});

	test("parses a JSON object string into an object", () => {
		expect(resolveValue('{"a":1}')).toEqual({ a: 1 });
	});

	test("parses a JSON array string into an array", () => {
		expect(resolveValue("[1,2,3]")).toEqual([1, 2, 3]);
	});

	test("returns original string when JSON parsing fails", () => {
		expect(resolveValue("{bad json}")).toBe("{bad json}");
	});

	test("passes through an object unchanged", () => {
		const obj = { x: 1 };
		expect(resolveValue(obj)).toBe(obj);
	});

	test("handles leading whitespace before JSON", () => {
		expect(resolveValue('  {"a":1}')).toEqual({ a: 1 });
	});
});

describe("isContainer", () => {
	test("returns true for arrays", () => {
		expect(isContainer([])).toBe(true);
		expect(isContainer([1, 2])).toBe(true);
	});

	test("returns true for plain objects", () => {
		expect(isContainer({})).toBe(true);
		expect(isContainer({ a: 1 })).toBe(true);
	});

	test("returns false for primitives", () => {
		expect(isContainer("string")).toBe(false);
		expect(isContainer(42)).toBe(false);
		expect(isContainer(null)).toBe(false);
		expect(isContainer(undefined)).toBe(false);
		expect(isContainer(true)).toBe(false);
	});
});

describe("toCopyText", () => {
	test("returns empty string for null and undefined", () => {
		expect(toCopyText(null)).toBe("");
		expect(toCopyText(undefined)).toBe("");
	});

	test("returns string as-is", () => {
		expect(toCopyText("hello")).toBe("hello");
	});

	test("serializes objects to pretty JSON", () => {
		expect(toCopyText({ a: 1 })).toBe(JSON.stringify({ a: 1 }, null, 2));
	});

	test("converts numbers to string", () => {
		expect(toCopyText(42)).toBe("42");
	});

	test("converts booleans to string", () => {
		expect(toCopyText(true)).toBe("true");
	});

	test("serializes arrays to pretty JSON", () => {
		expect(toCopyText([1, 2])).toBe(JSON.stringify([1, 2], null, 2));
	});
});

describe("isCopyableLeaf", () => {
	test("returns false for null and undefined", () => {
		expect(isCopyableLeaf(null)).toBe(false);
		expect(isCopyableLeaf(undefined)).toBe(false);
	});

	test("returns false for empty string", () => {
		expect(isCopyableLeaf("")).toBe(false);
	});

	test("returns false for http/https URLs", () => {
		expect(isCopyableLeaf("https://example.com")).toBe(false);
		expect(isCopyableLeaf("http://example.com/path")).toBe(false);
	});

	test("returns true for non-empty non-URL strings", () => {
		expect(isCopyableLeaf("hello")).toBe(true);
		expect(isCopyableLeaf("some value")).toBe(true);
	});

	test("returns true for numbers and booleans", () => {
		expect(isCopyableLeaf(42)).toBe(true);
		expect(isCopyableLeaf(0)).toBe(true);
		expect(isCopyableLeaf(true)).toBe(true);
		expect(isCopyableLeaf(false)).toBe(true);
	});
});

describe("entriesOf", () => {
	test("returns indexed entries for arrays", () => {
		expect(entriesOf(["a", "b"])).toEqual([
			[0, "a"],
			[1, "b"],
		]);
	});

	test("returns key-value entries for plain objects", () => {
		expect(entriesOf({ x: 1, y: 2 })).toEqual([
			["x", 1],
			["y", 2],
		]);
	});

	test("returns empty array for non-containers", () => {
		expect(entriesOf("string")).toEqual([]);
		expect(entriesOf(42)).toEqual([]);
		expect(entriesOf(null)).toEqual([]);
	});
});

describe("isDefaultOpen", () => {
	test("returns true when depth is less than DEFAULT_EXPANDED_DEPTH", () => {
		expect(isDefaultOpen(100, 0)).toBe(true);
		expect(isDefaultOpen(100, DEFAULT_EXPANDED_DEPTH - 1)).toBe(true);
	});

	test("returns false for empty container at max depth", () => {
		expect(isDefaultOpen(0, DEFAULT_EXPANDED_DEPTH)).toBe(false);
	});

	test("returns true for small non-empty containers beyond DEFAULT_EXPANDED_DEPTH", () => {
		expect(isDefaultOpen(SMALL_CONTAINER_THRESHOLD, DEFAULT_EXPANDED_DEPTH)).toBe(true);
		expect(isDefaultOpen(1, DEFAULT_EXPANDED_DEPTH)).toBe(true);
	});

	test("returns false for large containers beyond DEFAULT_EXPANDED_DEPTH", () => {
		expect(isDefaultOpen(SMALL_CONTAINER_THRESHOLD + 1, DEFAULT_EXPANDED_DEPTH)).toBe(false);
	});
});
