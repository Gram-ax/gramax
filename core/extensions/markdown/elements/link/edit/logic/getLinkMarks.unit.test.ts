import { getLinkMarks } from "@ext/markdown/elements/link/edit/logic/getLinkMarks";
import type { Mark } from "@tiptap/pm/model";
import { schema } from "prosemirror-schema-basic";

// schema-basic's `link` mark is non-inclusive, matching Gramax's Link mark.
const { doc: docNode, paragraph } = schema.nodes;
const linked = (text: string) => schema.text(text, [schema.marks.link.create({ href: "" })]);
const plain = (text: string) => schema.text(text);

const hasLink = (mark?: Mark) => mark?.type.name === "link";

describe("getLinkMarks", () => {
	// After toggleLink on a selection the cursor is collapsed to `to - 1`, which
	// for a single-letter word lands on a text-node boundary. Regression: #289.
	test("detects a single-letter link at its left boundary (cursor at to-1)", () => {
		// <p>a</p> with a link on "a"; cursor collapsed to pos 1 (left boundary).
		const doc = docNode.create(null, [paragraph.create(null, [linked("a")])]);
		const { current } = getLinkMarks(doc, 1);
		expect(hasLink(current)).toBe(true);
	});

	test("detects a multi-letter link with the cursor inside the word", () => {
		// <p>hello</p>, cursor at interior pos 5 (to - 1 for a full-word selection).
		const doc = docNode.create(null, [paragraph.create(null, [linked("hello")])]);
		const { current } = getLinkMarks(doc, 5);
		expect(hasLink(current)).toBe(true);
	});

	test("detects a two-letter link with the cursor inside the word", () => {
		const doc = docNode.create(null, [paragraph.create(null, [linked("hi")])]);
		const { current } = getLinkMarks(doc, 2);
		expect(hasLink(current)).toBe(true);
	});

	test("detects a link when the cursor sits immediately after a single-letter link", () => {
		// <p>ab</p> where only "a" is linked; cursor at pos 2 (right boundary of "a").
		const doc = docNode.create(null, [paragraph.create(null, [linked("a"), plain("b")])]);
		const { current } = getLinkMarks(doc, 2);
		expect(hasLink(current)).toBe(true);
	});

	test("returns no link for a cursor in plain text", () => {
		const doc = docNode.create(null, [paragraph.create(null, [plain("abc")])]);
		const { current, before, after } = getLinkMarks(doc, 2);
		expect(current).toBeUndefined();
		expect(before).toBeUndefined();
		expect(after).toBeUndefined();
	});
});
