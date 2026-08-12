import type { CommentBlock } from "@core-ui/CommentBlock";
import { collectClipboardComments } from "@ext/markdown/elements/comment/edit/logic/clipboardComments";
import { Fragment, Schema } from "@tiptap/pm/model";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "inline*", attrs: { comment: { default: { id: null } } } },
		text: { group: "inline" },
	},
	marks: {
		comment: { attrs: { id: {} } },
	},
});

const body = (mail: string): CommentBlock => ({
	comment: { dateTime: "2026-01-01", content: [], user: { mail, name: mail } },
	answers: [],
});

const bodies = new Map([
	["c1", body("a@b.c")],
	["c2", body("d@e.f")],
]);

const marked = (text: string, commentId?: string) =>
	schema.text(text, commentId ? [schema.marks.comment.create({ id: commentId })] : []);

const paragraph = (text: string, attrs?: { comment: { id: string } }) =>
	schema.nodes.paragraph.create(attrs, marked(text));

test("bundles the body of every comment the fragment points at", () => {
	const fragment = Fragment.from([
		schema.nodes.paragraph.create(null, marked("commented", "c1")),
		schema.nodes.paragraph.create(null, marked("plain")),
	]);

	expect(collectClipboardComments(fragment, bodies)).toEqual({ c1: bodies.get("c1") });
});

test("picks up comments attached to a block, not just to marks", () => {
	const fragment = Fragment.from(paragraph("text", { comment: { id: "c2" } }));

	expect(collectClipboardComments(fragment, bodies)).toEqual({ c2: bodies.get("c2") });
});

test("bundles a comment shared by several nodes once", () => {
	const fragment = Fragment.from([
		schema.nodes.paragraph.create(null, marked("first", "c1")),
		schema.nodes.paragraph.create(null, marked("second", "c1")),
	]);

	expect(collectClipboardComments(fragment, bodies)).toEqual({ c1: bodies.get("c1") });
});

test("skips ids the storage has no body for rather than writing an empty entry", () => {
	const fragment = Fragment.from(schema.nodes.paragraph.create(null, marked("text", "unknown")));

	expect(collectClipboardComments(fragment, bodies)).toEqual({});
});

test("returns nothing when the storage is empty", () => {
	const fragment = Fragment.from(schema.nodes.paragraph.create(null, marked("text", "c1")));

	expect(collectClipboardComments(fragment, new Map())).toEqual({});
});
