import type { JSONContent } from "@tiptap/core";
import extractPreviewFromEditTree from "./extractPreviewFromEditTree";

describe("extractPreviewFromEditTree", () => {
	describe("falsy input", () => {
		test("returns empty string for null", () => {
			expect(extractPreviewFromEditTree(null)).toBe("");
		});

		test("returns empty string for undefined", () => {
			expect(extractPreviewFromEditTree(undefined)).toBe("");
		});
	});

	describe("empty / no text", () => {
		test("returns empty string for node with no text and no content", () => {
			const tree: JSONContent = { type: "doc" };
			expect(extractPreviewFromEditTree(tree)).toBe("");
		});

		test("returns empty string for node with empty content array", () => {
			const tree: JSONContent = { type: "doc", content: [] };
			expect(extractPreviewFromEditTree(tree)).toBe("");
		});

		test("returns empty string for content nodes that carry no text", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [{ type: "paragraph", content: [] }],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("");
		});
	});

	describe("simple text extraction", () => {
		test("returns text from a root text node", () => {
			const tree: JSONContent = { type: "text", text: "Hello" };
			expect(extractPreviewFromEditTree(tree)).toBe("Hello");
		});

		test("returns text from a single nested text node", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [{ type: "text", text: "Hello world" }],
					},
				],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("Hello world");
		});

		test("joins text from multiple siblings with spaces", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{ type: "text", text: "Hello" },
					{ type: "text", text: "world" },
				],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("Hello world");
		});

		test("joins text from multiple paragraphs", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{ type: "paragraph", content: [{ type: "text", text: "First paragraph" }] },
					{ type: "paragraph", content: [{ type: "text", text: "Second paragraph" }] },
				],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("First paragraph Second paragraph");
		});
	});

	describe("deep nesting", () => {
		test("extracts text from deeply nested nodes", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{
						type: "blockquote",
						content: [
							{
								type: "paragraph",
								content: [
									{
										type: "strong",
										content: [{ type: "text", text: "Deep text" }],
									},
								],
							},
						],
					},
				],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("Deep text");
		});

		test("collects text from all branches in document order", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{
						type: "paragraph",
						content: [
							{ type: "text", text: "One" },
							{
								type: "strong",
								content: [{ type: "text", text: "Two" }],
							},
							{ type: "text", text: "Three" },
						],
					},
				],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("One Two Three");
		});
	});

	describe("whitespace normalisation", () => {
		test("collapses multiple spaces inside a text node", () => {
			const tree: JSONContent = { type: "text", text: "hello   world" };
			expect(extractPreviewFromEditTree(tree)).toBe("hello world");
		});

		test("trims leading and trailing whitespace", () => {
			const tree: JSONContent = { type: "text", text: "  hello world  " };
			expect(extractPreviewFromEditTree(tree)).toBe("hello world");
		});

		test("collapses whitespace introduced by joining separate text nodes", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{ type: "text", text: "hello " },
					{ type: "text", text: " world" },
				],
			};
			expect(extractPreviewFromEditTree(tree)).toBe("hello world");
		});
	});

	describe("maxLength truncation", () => {
		test("returns text unchanged when shorter than default maxLength (100)", () => {
			const short = "Short text";
			const tree: JSONContent = { type: "text", text: short };
			expect(extractPreviewFromEditTree(tree)).toBe(short);
		});

		test("truncates to default maxLength of 100", () => {
			const longText = "a".repeat(120);
			const tree: JSONContent = { type: "text", text: longText };
			const result = extractPreviewFromEditTree(tree);
			expect(result.length).toBeLessThanOrEqual(100);
		});

		test("truncates to custom maxLength", () => {
			const tree: JSONContent = { type: "text", text: "Hello world" };
			const result = extractPreviewFromEditTree(tree, 5);
			expect(result.length).toBeLessThanOrEqual(5);
			expect(result).toBe("Hello");
		});

		test("text exactly at maxLength is not truncated", () => {
			const text = "a".repeat(100);
			const tree: JSONContent = { type: "text", text: text };
			expect(extractPreviewFromEditTree(tree)).toBe(text);
		});

		test("respects custom maxLength of 0 and returns empty string", () => {
			const tree: JSONContent = { type: "text", text: "Hello" };
			const result = extractPreviewFromEditTree(tree, 0);
			expect(result).toBe("");
		});
	});

	describe("early-exit walk optimisation", () => {
		test("stops collecting text once accumulated length reaches maxLength", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{ type: "text", text: "12345" },
					{ type: "text", text: "should not appear" },
				],
			};
			// maxLength=5: after collecting "12345" (length 5) the walk skips remaining nodes
			const result = extractPreviewFromEditTree(tree, 5);
			expect(result).toBe("12345");
			expect(result).not.toContain("should not appear");
		});

		test("does not recurse into children of a skipped node", () => {
			const tree: JSONContent = {
				type: "doc",
				content: [
					{ type: "text", text: "12345" },
					{
						type: "paragraph",
						content: [{ type: "text", text: "hidden child" }],
					},
				],
			};
			const result = extractPreviewFromEditTree(tree, 5);
			expect(result).not.toContain("hidden child");
		});
	});
});
