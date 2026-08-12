import { multilineCodeBlock } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/multilineCodeBlock";
import { type Node as ProsemirrorNode, Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		ordered_list: { group: "block", content: "list_item+" },
		list_item: { content: "listItemContent block*", defining: true },
		paragraph: { group: "block listItemContent", content: "inline*" },
		code_block: { group: "block listItemContent", content: "text*", code: true, marks: "" },
		text: { group: "inline" },
	},
	marks: {},
});

const { doc, ordered_list, list_item, paragraph } = schema.nodes;
const p = (text: string) => paragraph.create(null, schema.text(text));

const textPos = (node: ProsemirrorNode, text: string) => {
	let pos = -1;
	node.descendants((child, childPos) => {
		if (pos === -1 && child.isText && child.text === text) pos = childPos;
	});
	return pos;
};

const run = (docNode: ProsemirrorNode, from: number, to: number) => {
	const state = EditorState.create({ schema, doc: docNode, selection: TextSelection.create(docNode, from, to) });
	let next = state;
	multilineCodeBlock()(state, (tr) => {
		next = state.apply(tr);
	});
	return next.doc;
};

test("converting selected paragraphs inside a list item keeps the rest of the list intact", () => {
	const docNode = doc.create(null, [
		ordered_list.create(null, [
			list_item.create(null, [
				p("Open the web application"),
				p("Click Create New."),
				p("Add new articles and edit them."),
			]),
			list_item.create(null, [p("Click Configure Catalog")]),
		]),
	]);

	const from = textPos(docNode, "Click Create New.");
	const to = textPos(docNode, "Add new articles and edit them.") + "Add new articles and edit them.".length;

	const list = run(docNode, from, to).firstChild;

	expect(list.type.name).toBe("ordered_list");
	expect(list.childCount).toBe(2);

	const firstItem = list.child(0);
	expect(firstItem.childCount).toBe(2);
	expect(firstItem.child(0).type.name).toBe("paragraph");
	expect(firstItem.child(0).textContent).toBe("Open the web application");
	expect(firstItem.child(1).type.name).toBe("code_block");
	expect(firstItem.child(1).textContent).toBe("Click Create New.\nAdd new articles and edit them.");

	expect(list.child(1).textContent).toBe("Click Configure Catalog");
});

test("converting top-level paragraphs merges them into a single code block", () => {
	const docNode = doc.create(null, [p("line one"), p("line two")]);

	const from = textPos(docNode, "line one");
	const to = textPos(docNode, "line two") + "line two".length;

	const result = run(docNode, from, to);

	expect(result.childCount).toBe(1);
	expect(result.child(0).type.name).toBe("code_block");
	expect(result.child(0).textContent).toBe("line one\nline two");
});
