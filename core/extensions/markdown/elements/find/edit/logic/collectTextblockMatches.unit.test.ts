import { getSchema } from "@ext/markdown/core/edit/logic/Prosemirror/schema";
import collectTextblockMatches from "./collectTextblockMatches";

type TextPart = string | { text: string; marks?: string[] };

const schema = getSchema();

const createParagraph = (...content: TextPart[]) => {
	if (content.length === 0) return schema.node("paragraph");

	const nodes = content.map((part) => {
		if (typeof part === "string") return schema.text(part);

		const marks = (part.marks ?? []).map((markName) => schema.marks[markName].create());
		return schema.text(part.text, marks);
	});

	return schema.node("paragraph", null, nodes);
};

const createDoc = (...paragraphs: ReturnType<typeof createParagraph>[]) => schema.node("doc", null, paragraphs);

describe("collectTextblockMatches", () => {
	it("returns empty array when search term is empty", () => {
		const doc = createDoc(createParagraph("Hello"));

		const matches = collectTextblockMatches(doc, "", false, false);

		expect(matches).toEqual([]);
	});

	it("matches across marks and keeps mark info from the start position", () => {
		const doc = createDoc(createParagraph("He", { text: "xllo", marks: ["strong"] }, " world"));

		const matches = collectTextblockMatches(doc, "llo w", true, false);

		expect(matches).toHaveLength(1);
		expect(doc.textBetween(matches[0].start, matches[0].end)).toBe("llo w");
		expect(matches[0].marks.some((mark) => mark.type.name === "strong")).toBe(true);
	});

	it("normalizes NBSP to spaces for matching", () => {
		const nbsp = "\u00A0";
		const doc = createDoc(createParagraph(`Hello${nbsp}world`));

		const matches = collectTextblockMatches(doc, "Hello world", true, false);

		expect(matches).toHaveLength(1);
		expect(doc.textBetween(matches[0].start, matches[0].end)).toBe(`Hello${nbsp}world`);
	});

	it("respects case sensitivity and whole word options", () => {
		const doc = createDoc(createParagraph("Hello worldwide world"));

		expect(collectTextblockMatches(doc, "hello", true, false)).toHaveLength(0);
		expect(collectTextblockMatches(doc, "hello", false, false)).toHaveLength(1);

		expect(collectTextblockMatches(doc, "world", false, true)).toHaveLength(1);
		expect(collectTextblockMatches(doc, "world", false, false)).toHaveLength(2);
	});
});
