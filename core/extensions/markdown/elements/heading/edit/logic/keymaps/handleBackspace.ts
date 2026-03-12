import { type Editor, findParentNode } from "@tiptap/core";

export const handleBackspace = (editor: Editor) => {
	const { $from, to } = editor.state.selection;
	if ($from.pos !== to || $from.parentOffset !== 0) return false;

	const data = findParentNode((node) => node.type.name === "heading")(editor.state.selection);
	if (!data) return false;

	const { node: parent } = data;
	if (parent.type.name !== "heading") return false;

	const previousNodePos = data.pos - 2;
	const previousNode = editor.state.doc.nodeAt(previousNodePos);

	if (!previousNode || !previousNode.isTextblock || previousNode.type.spec.code || previousNode.childCount > 0) {
		return false;
	}

	const previousNodeStartPos = previousNodePos - previousNode.nodeSize + 1;
	return editor.chain().deleteRange({ from: previousNodeStartPos, to: data.pos }).run();
};
