import type { Editor } from "@tiptap/core";
import { Schema } from "prosemirror-model";
import { isUnchangedContent } from "./isUnchangedContent";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: { group: "block", content: "text*", toDOM: () => ["p", 0] },
		text: {},
	},
});

const docJson = (text: string) => ({
	type: "doc",
	content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const editorWith = (text: string): Editor =>
	({
		schema,
		state: { doc: schema.nodeFromJSON(docJson(text)) },
	}) as unknown as Editor;

test("returns true when incoming content equals current doc", () => {
	expect(isUnchangedContent(editorWith("hello"), docJson("hello"))).toBe(true);
});

test("returns false when incoming content differs", () => {
	expect(isUnchangedContent(editorWith("hello"), docJson("world"))).toBe(false);
});

test("returns false on malformed content (so the update still applies)", () => {
	expect(isUnchangedContent(editorWith("hello"), { type: "nope" })).toBe(false);
});
