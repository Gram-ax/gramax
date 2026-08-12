import Heading from "@ext/markdown/elements/heading/edit/model/heading";
import UpdateHeadingId from "@ext/markdown/elements/heading/edit/views/UpdateHeadingId";
import type { JSONContent } from "@tiptap/core";
import { Editor, Node } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Text from "@tiptap/extension-text";
import { TextSelection } from "prosemirror-state";

const Paragraph = Node.create({
	name: "paragraph",
	group: "block",
	content: "inline*",
	parseHTML: () => [{ tag: "p" }],
	renderHTML: () => ["p", 0],
});

// the plugin from the Heading extension installs its own UpdateHeadingId view;
// tests drive the view manually, so it is disabled here
const TestHeading = Heading.extend({ addProseMirrorPlugins: () => [] });

const heading = (text: string, id: string, isCustomId = false): JSONContent => ({
	type: "heading",
	attrs: { level: 2, id, isCustomId },
	content: [{ type: "text", text }],
});

const paragraph = (text: string): JSONContent => ({ type: "paragraph", content: [{ type: "text", text }] });

const createEditor = (content: JSONContent[]) => {
	const element = document.createElement("div");
	document.body.append(element);
	return new Editor({
		element,
		content: { type: "doc", content },
		extensions: [Document, TestHeading, Paragraph, Text],
	});
};

const endOf = (editor: Editor, childIndex: number) => {
	let position = 0;
	for (let index = 0; index < childIndex; index++) position += editor.state.doc.child(index).nodeSize;
	return position + editor.state.doc.child(childIndex).nodeSize - 1;
};

describe("UpdateHeadingId", () => {
	let editor: Editor;

	afterEach(() => {
		editor?.destroy();
		document.body.innerHTML = "";
	});

	test("updates the ID of the edited heading", () => {
		editor = createEditor([heading("Section", "section")]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);
		const lastState = editor.state;

		editor.chain().setTextSelection(endOf(editor, 0)).insertContent("s").run();
		updateHeadingId.update(editor.view, lastState);

		expect(editor.state.doc.child(0).attrs.id).toBe("sections");
	});

	test("adds a suffix when another heading already uses the ID", () => {
		editor = createEditor([heading("Section", "section"), heading("Sectio", "sectio")]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);
		const lastState = editor.state;

		editor.chain().setTextSelection(endOf(editor, 1)).insertContent("n").run();
		updateHeadingId.update(editor.view, lastState);

		expect(editor.state.doc.child(0).attrs.id).toBe("section");
		expect(editor.state.doc.child(1).attrs.id).toBe("section-1");
	});

	test("keeps a custom ID", () => {
		editor = createEditor([heading("Section", "custom-id", true)]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);
		const lastState = editor.state;

		editor.chain().setTextSelection(endOf(editor, 0)).insertContent("s").run();
		updateHeadingId.update(editor.view, lastState);

		expect(editor.state.doc.child(0).attrs.id).toBe("custom-id");
	});

	test("does nothing when the document has not changed", () => {
		editor = createEditor([heading("Section", "stale-id")]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);

		editor.commands.setTextSelection(endOf(editor, 0));
		updateHeadingId.update(editor.view, editor.state);

		expect(editor.state.doc.child(0).attrs.id).toBe("stale-id");
	});

	test("does nothing when the cursor is not inside a heading", () => {
		editor = createEditor([heading("Section", "stale-id"), paragraph("text")]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);
		const lastState = editor.state;

		editor.chain().setTextSelection(endOf(editor, 1)).insertContent("!").run();
		updateHeadingId.update(editor.view, lastState);

		expect(editor.state.doc.child(0).attrs.id).toBe("stale-id");
	});

	test("does nothing when the edit did not touch the selected heading", () => {
		editor = createEditor([heading("Section", "stale-id"), paragraph("text")]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);
		editor.commands.setTextSelection(endOf(editor, 0));
		const lastState = editor.state;

		editor.view.dispatch(editor.state.tr.insertText("!", endOf(editor, 1)));
		updateHeadingId.update(editor.view, lastState);

		expect(editor.state.doc.child(0).attrs.id).toBe("stale-id");
	});

	test("does not dispatch a transaction when the ID is already correct", () => {
		editor = createEditor([heading("Section", "section"), paragraph("text")]);
		const updateHeadingId = new UpdateHeadingId(editor.view, editor);
		editor.commands.setTextSelection(endOf(editor, 1));
		const lastState = editor.state;

		// the cursor moves into the heading, so the heading itself is checked, but its ID already matches
		const transaction = editor.state.tr.insertText("!", endOf(editor, 1));
		transaction.setSelection(TextSelection.create(transaction.doc, endOf(editor, 0)));
		editor.view.dispatch(transaction);

		const onTransaction = jest.fn();
		editor.on("transaction", onTransaction);
		updateHeadingId.update(editor.view, lastState);

		expect(onTransaction).not.toHaveBeenCalled();
		expect(editor.state.doc.child(0).attrs.id).toBe("section");
	});
});
