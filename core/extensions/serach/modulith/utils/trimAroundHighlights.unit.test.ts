import type { SearchResultMarkItem } from "@ext/serach/Searcher";
import { trimAroundHighlights } from "./trimAroundHighlights";

type TestCase = {
	name: string;
	items: SearchResultMarkItem[];
	context?: number;
	expected: SearchResultMarkItem[];
};

describe("trimAroundHighlights", () => {
	const cases: TestCase[] = [
		{
			name: "no highlights",
			items: [{ type: "text", text: "hello world" }],
			expected: [{ type: "text", text: "hello world" }],
		},
		{
			name: "single highlight at start, default context",
			items: [
				{ type: "highlight", text: "hello" },
				{ type: "text", text: " world, how are you?" },
			],
			expected: [
				{ type: "highlight", text: "hello" },
				{ type: "text", text: " world, how are you?" },
			],
		},
		{
			name: "single highlight in middle, context 5",
			items: [
				{ type: "text", text: "12345" },
				{ type: "highlight", text: "abc" },
				{ type: "text", text: "67890" },
			],
			context: 5,
			expected: [
				{ type: "text", text: "12345" },
				{ type: "highlight", text: "abc" },
				{ type: "text", text: "67890" },
			],
		},
		{
			name: "two highlights merged by context",
			items: [
				{ type: "text", text: "aaaa" },
				{ type: "highlight", text: "b" },
				{ type: "text", text: "cccc" },
				{ type: "highlight", text: "d" },
				{ type: "text", text: "eeee" },
			],
			context: 3,
			expected: [
				{ type: "text", text: "...aaa" },
				{ type: "highlight", text: "b" },
				{ type: "text", text: "cccc" },
				{ type: "highlight", text: "d" },
				{ type: "text", text: "eee" },
				{ type: "text", text: "..." },
			],
		},
		{
			name: "highlight at start of text with trimming",
			items: [
				{ type: "text", text: "xxxxxx" },
				{ type: "highlight", text: "highlight" },
				{ type: "text", text: "yyyyyy" },
			],
			context: 3,
			expected: [
				{ type: "text", text: "...xxx" },
				{ type: "highlight", text: "highlight" },
				{ type: "text", text: "yyy" },
				{ type: "text", text: "..." },
			],
		},
		{
			name: "entire text is highlight",
			items: [{ type: "highlight", text: "all text is highlighted" }],
			expected: [{ type: "highlight", text: "all text is highlighted" }],
		},
		{
			name: "multiple disjoint highlights",
			items: [
				{ type: "text", text: "12345" },
				{ type: "highlight", text: "a" },
				{ type: "text", text: "6789" },
				{ type: "highlight", text: "b" },
				{ type: "text", text: "0" },
				{ type: "highlight", text: "c" },
			],
			context: 1,
			expected: [
				{ type: "text", text: "...5" },
				{ type: "highlight", text: "a" },
				{ type: "text", text: "6" },
				{ type: "text", text: "...9" },
				{ type: "highlight", text: "b" },
				{ type: "text", text: "0" },
				{ type: "highlight", text: "c" },
			],
		},
		{
			name: "highlight at end of text",
			items: [
				{ type: "text", text: "start " },
				{ type: "highlight", text: "end" },
			],
			context: 3,
			expected: [
				{ type: "text", text: "...rt " },
				{ type: "highlight", text: "end" },
			],
		},
		{
			name: "highlights merging through context",
			items: [
				{ type: "text", text: "aaa" },
				{ type: "highlight", text: "b" },
				{ type: "text", text: "c" },
				{ type: "highlight", text: "d" },
				{ type: "text", text: "eee" },
			],
			context: 2,
			expected: [
				{ type: "text", text: "...aa" },
				{ type: "highlight", text: "b" },
				{ type: "text", text: "c" },
				{ type: "highlight", text: "d" },
				{ type: "text", text: "ee" },
				{ type: "text", text: "..." },
			],
		},
	];

	it.each(cases)("$name", ({ items, context, expected }) => {
		expect(trimAroundHighlights(items, context)).toEqual(expected);
	});
});
