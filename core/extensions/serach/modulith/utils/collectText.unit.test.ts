import type { SearchResultMarkItem } from "@ext/serach/Searcher";
import { collectText } from "./collectText";

type TestCase = {
	name: string;
	items: SearchResultMarkItem[];
	charCount?: number;
	expected: string;
};

const cases: TestCase[] = [
	{
		name: "returns full text when total length is less than charCount",
		items: [
			{ type: "text", text: "Hello " },
			{ type: "highlight", text: "world" },
		],
		charCount: 30,
		expected: "Hello world",
	},
	{
		name: "cuts text when total length exceeds charCount",
		items: [
			{ type: "text", text: "Hello " },
			{ type: "highlight", text: "world!" },
		],
		charCount: 8,
		expected: "Hello wo",
	},
	{
		name: "uses default charCount when not provided",
		items: [{ type: "text", text: "a".repeat(40) }],
		expected: "a".repeat(30),
	},
	{
		name: "returns empty string when items array is empty",
		items: [],
		charCount: 10,
		expected: "",
	},
	{
		name: "returns empty string when charCount is zero",
		items: [{ type: "text", text: "Hello" }],
		charCount: 0,
		expected: "",
	},
	{
		name: "does not split items beyond necessary",
		items: [
			{ type: "text", text: "Hello" },
			{ type: "highlight", text: "World" },
			{ type: "text", text: "!!!" },
		],
		charCount: 10,
		expected: "HelloWorld",
	},
	{
		name: "cuts inside a single item when remaining chars are not enough",
		items: [{ type: "highlight", text: "HighlightedText" }],
		charCount: 5,
		expected: "Highl",
	},
	{
		name: "returns full text when total length is less than charCount",
		items: [
			{ type: "text", text: "Hello " },
			{ type: "highlight", text: "world" },
		],
		charCount: 30,
		expected: "Hello world",
	},
	{
		name: "cuts text when total length exceeds charCount",
		items: [
			{ type: "text", text: "Hello " },
			{ type: "highlight", text: "world!" },
		],
		charCount: 8,
		expected: "Hello wo",
	},
	{
		name: "uses default charCount when not provided",
		items: [{ type: "text", text: "a".repeat(40) }],
		expected: "a".repeat(30),
	},
	{
		name: "returns empty string when items array is empty",
		items: [],
		charCount: 10,
		expected: "",
	},
	{
		name: "returns empty string when charCount is zero",
		items: [{ type: "text", text: "Hello" }],
		charCount: 0,
		expected: "",
	},
	{
		name: "does not split items beyond necessary",
		items: [
			{ type: "text", text: "Hello" },
			{ type: "highlight", text: "World" },
			{ type: "text", text: "!!!" },
		],
		charCount: 10,
		expected: "HelloWorld",
	},
	{
		name: "handles large number of small items",
		items: Array.from({ length: 1_000 }, (_, i) => ({
			type: i % 2 === 0 ? "text" : "highlight",
			text: "a",
		})),
		charCount: 500,
		expected: "a".repeat(500),
	},
	{
		name: "stops exactly at item boundary when charCount matches sum",
		items: [
			{ type: "text", text: "12345" },
			{ type: "highlight", text: "67890" },
		],
		charCount: 10,
		expected: "1234567890",
	},
	{
		name: "cuts inside item after many preceding items",
		items: [
			...Array.from({ length: 50 }, () => ({
				type: "text" as const,
				text: "ab",
			})),
			{ type: "highlight", text: "cdefgh" },
		],
		charCount: 105, // 50 * 2 = 100, + 5 from last item
		expected: `${"ab".repeat(50)}cdefg`,
	},
	{
		name: "ignores remaining items after limit is reached",
		items: [
			{ type: "text", text: "123" },
			{ type: "highlight", text: "456" },
			{ type: "text", text: "789" },
			{ type: "highlight", text: "000" },
		],
		charCount: 6,
		expected: "123456",
	},
	{
		name: "handles very long single item",
		items: [{ type: "highlight", text: "x".repeat(10_000) }],
		charCount: 9_999,
		expected: "x".repeat(9_999),
	},
	{
		name: "handles mixture of empty and non-empty texts",
		items: [
			{ type: "text", text: "" },
			{ type: "highlight", text: "Hello" },
			{ type: "text", text: "" },
			{ type: "highlight", text: "World" },
		],
		charCount: 10,
		expected: "HelloWorld",
	},
	{
		name: "returns empty string when all items have empty text",
		items: [
			{ type: "text", text: "" },
			{ type: "highlight", text: "" },
		],
		charCount: 5,
		expected: "",
	},
];

describe("collectText", () => {
	it.each(cases)("$name", ({ items, charCount, expected }) => {
		const result = charCount === undefined ? collectText(items) : collectText(items, charCount);

		expect(result).toBe(expected);
	});
});
