import { MarkdownDocumentParser } from "./markdownParser";

const READ_MAX_CHARS = 100;

jest.mock("../../core/agentConfig", () => ({
	agentConfig: { readMaxChars: READ_MAX_CHARS },
}));

describe("MarkdownDocumentParser", () => {
	test("splitFirstParagraph separates first paragraph from rest", () => {
		const result = MarkdownDocumentParser.splitFirstParagraph("Description\nline 2\n\n## Rules\n\nContent");

		expect(result).toEqual({
			firstParagraph: "Description\nline 2",
			rest: "## Rules\n\nContent",
		});
	});

	test("splitFirstParagraph returns empty rest for single paragraph", () => {
		const result = MarkdownDocumentParser.splitFirstParagraph("Only description");

		expect(result).toEqual({
			firstParagraph: "Only description",
			rest: "",
		});
	});

	test("getHeadingHierarchy builds stable ids and section line ranges", () => {
		const markdown = "# A\ntext\n## B\nmore\n# A\nfinal";
		const headings = MarkdownDocumentParser.getHeadingHierarchy(markdown);
		const first = headings[0]!;
		const child = first.children[0]!;
		const second = headings[1]!;

		expect([first.id, child.id, second.id]).toEqual(["a", "b", "a-2"]);
		expect([first.lineStart, child.lineStart, second.lineStart]).toEqual([1, 3, 5]);
		expect([first.lineEnd, child.lineEnd, second.lineEnd]).toEqual([4, 4, 6]);
	});

	test("getMarkdownForHeadingSection returns chapter markdown by heading id", () => {
		const markdown = "# A\ntext\n## B\nmore\n# A\nfinal";

		expect(MarkdownDocumentParser.getHeadingSectionMarkdown(markdown, "b")).toBe("## B\nmore");
		expect(() => MarkdownDocumentParser.getHeadingSectionMarkdown(markdown, "missing")).toThrow();
	});

	test("applyHeadingSectionEdit replaces only the target chapter", () => {
		const markdown = "# A\ntext\n## B\nmore\n# A\nfinal";

		const next = MarkdownDocumentParser.applyHeadingSectionEdit(markdown, "b", "## B\nrewritten");
		expect(next).toBe("# A\ntext\n## B\nrewritten\n# A\nfinal");
		expect(() => MarkdownDocumentParser.applyHeadingSectionEdit(markdown, "missing", "## X")).toThrow();
	});

	test("getHeadingHierarchy splits oversized section into chunks", () => {
		const body = "x".repeat(101);
		const markdown = `# Doc\n## Big\n${body}`;
		const doc = MarkdownDocumentParser.getHeadingHierarchy(markdown)[0]!;
		const chunks = doc.children;

		expect(doc.id).toBe("doc");
		expect(chunks).toHaveLength(3);
		expect(new Set(chunks.map((h) => h.id)).size).toBe(3);

		const contents = chunks.map((h) => MarkdownDocumentParser.getHeadingSectionMarkdown(markdown, h.id));
		expect(contents.every((c) => c.length <= READ_MAX_CHARS)).toBe(true);
		expect(contents[0]).toContain("## Big");
		expect(contents[1]).toHaveLength(100);
		expect(contents[2]).toHaveLength(1);
		expect(contents.slice(1).join("")).toBe(body);
	});

	test("getHeadingHierarchy exposes preamble before first heading in oversized document", () => {
		const markdown = `Intro text\n# A\n${"x".repeat(95)}`;
		const headings = MarkdownDocumentParser.getHeadingHierarchy(markdown);

		expect(headings[0]!.id).toBe("chunk~1");
		expect(headings[1]!.id).toBe("a");
		expect(MarkdownDocumentParser.getHeadingSectionMarkdown(markdown, "chunk~1")).toBe("Intro text");
	});

	test("getHeadingHierarchy splits oversized single line into char chunks", () => {
		const source = "x".repeat(250);
		const parts = MarkdownDocumentParser.getHeadingHierarchy(source);

		expect(parts).toHaveLength(3);
		expect(new Set(parts.map((h) => h.id)).size).toBe(3);

		const contents = parts.map((h) => MarkdownDocumentParser.getHeadingSectionMarkdown(source, h.id));
		expect(contents.map((c) => c.length)).toEqual([100, 100, 50]);
		expect(contents.every((c) => c.length <= READ_MAX_CHARS)).toBe(true);
		expect(contents.join("")).toBe(source);
	});

	test("getHeadingHierarchy splits headingless document into part chunks", () => {
		const source = `${"x".repeat(60)}\n${"y".repeat(60)}`;
		const parts = MarkdownDocumentParser.getHeadingHierarchy(source);

		expect(parts).toHaveLength(2);
		expect(new Set(parts.map((h) => h.id)).size).toBe(2);

		const contents = parts.map((h) => MarkdownDocumentParser.getHeadingSectionMarkdown(source, h.id));
		expect(contents.every((c) => c.length <= READ_MAX_CHARS)).toBe(true);
		expect(contents.join("\n")).toBe(source);
	});
});
