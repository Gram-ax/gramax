import { isMarkdownText } from "@ext/markdown/elements/pasteMarkdown/logic/handlePasteMarkdown";
import { hasSemanticHtml } from "@ext/markdown/elements/pasteMarkdown/logic/hasSemanticHtml";
import { Fragment, Schema, Slice } from "@tiptap/pm/model";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { content: "inline*", group: "block" },
		heading: { content: "inline*", group: "block" },
		text: { group: "inline" },
	},
	marks: {
		link: { attrs: { href: {} } },
		textStyle: {},
	},
});

const createSlice = (node: Parameters<typeof Fragment.from>[0]) => new Slice(Fragment.from(node), 0, 0);

describe("pasteMarkdown", () => {
	it.each([
		"# Heading\n",
		"*italic*",
		"**bold**",
		"_italic_",
		"__bold__",
		"- list item",
		"1. list item",
		"[link](https://example.com)",
		"| Column |\n| --- |\n| Value |",
	])("detects Markdown in %p", (markdown) => {
		expect(isMarkdownText(markdown)).toBe(true);
	});

	it.each(["", "plain text"])("does not detect Markdown in %p", (text) => {
		expect(isMarkdownText(text)).toBe(false);
	});

	it("detects Markdown consistently across repeated checks", () => {
		const markdown = "## Heading\n";

		expect(isMarkdownText(markdown)).toBe(true);
		expect(isMarkdownText(markdown)).toBe(true);
	});

	it("ignores presentation-only marks from code editors", () => {
		const text = schema.text("## Heading", [schema.marks.textStyle.create()]);
		const slice = createSlice(schema.nodes.paragraph.create(null, text));

		expect(hasSemanticHtml(slice)).toBe(false);
	});

	it("preserves semantic HTML", () => {
		const headingSlice = createSlice(schema.nodes.heading.create(null, schema.text("Heading")));
		const linkedText = schema.text("Heading", [schema.marks.link.create({ href: "https://example.com" })]);
		const linkSlice = createSlice(schema.nodes.paragraph.create(null, linkedText));

		expect(hasSemanticHtml(headingSlice)).toBe(true);
		expect(hasSemanticHtml(linkSlice)).toBe(true);
	});
});
