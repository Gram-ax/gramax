import Path from "@core/FileProvider/Path/Path";
import { MarkdownDocumentParser } from "./markdownParser";

describe("MarkdownDocumentParser", () => {
	test("fromGramaxItem throws error for invalid item type", () => {
		expect(() => MarkdownDocumentParser.fromGramaxItem({ type: "file", content: "" })).toThrow();
	});

	test("splitForAgentStorage extracts first heading as title", () => {
		const markdown = "# Title\nLine 1\nLine 2";
		const result = MarkdownDocumentParser.splitForAgentStorage(markdown);

		expect(result).toEqual({
			title: "Title",
			storageBody: "Line 1\nLine 2",
		});
	});

	test("buildVirtualArticleForRead does not duplicate same H1", () => {
		const virtual = MarkdownDocumentParser.buildVirtualArticleForRead("# Title\nBody", "Title");
		expect(virtual).toBe("# Title\nBody");
	});

	test("parseFlatHeadings builds stable ids and section line ranges", () => {
		const markdown = "# A\ntext\n## B\nmore\n# A\nfinal";
		const headings = MarkdownDocumentParser.parseFlatHeadings(markdown);

		expect(headings.map((h) => h.id)).toEqual(["a", "b", "a-2"]);
		expect(headings.map((h) => h.lineStart)).toEqual([1, 3, 5]);
		expect(headings.map((h) => h.lineEnd)).toEqual([4, 4, 6]);
	});

	test("applyLineRangeEditToSource replaces inclusive line range", () => {
		const source = "a\nb\nc\nd";
		const next = MarkdownDocumentParser.applyLineRangeEditToSource(source, 2, 3, "X\nY");
		expect(next).toBe("a\nX\nY\nd");
	});

	test("applyLineRangeEditToSource supports insert mode", () => {
		const source = "a\nb\nc";
		const next = MarkdownDocumentParser.applyLineRangeEditToSource(source, 2, 1, "X");
		expect(next).toBe("a\nX\nb\nc");
	});

	test("expandMermaidPathTagsInSource inlines mermaid script", async () => {
		const source = 'before\n<mermaid path="diag.mmd" />\nafter';
		const out = await MarkdownDocumentParser.expandMermaidPathTagsInSource(
			source,
			new Path("docs/section"),
			async () => "graph TD;\r\nA-->B\r\n",
		);

		expect(out).toContain("```mermaid\ngraph TD;\nA-->B\n```");
		expect(out).toContain("before");
		expect(out).toContain("after");
	});
});
