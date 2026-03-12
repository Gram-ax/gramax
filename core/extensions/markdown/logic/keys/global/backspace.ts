import { isNodeSelectable } from "@ext/markdown/elementsUtils/isNodeSelectable";
import getNodeByPos from "../../../elementsUtils/getNodeByPos";
import isTypeOf from "../../../elementsUtils/isTypeOf";
import type KeyboardRule from "../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import type KeyboardShortcut from "../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const betweenNoteOrCut: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { node, position } = getNodeByPos(
		state.selection.anchor,
		state.doc,
		(node) => node.type.name === "paragraph",
	);
	const { node: nodeBefore } = getNodeByPos(position - 1, state.doc, (node) => isTypeOf(node, ["note", "cut"]));
	const { node: nodeAfter } = getNodeByPos(position + 2, state.doc, (node) => isTypeOf(node, ["note", "cut"]));

	if (!(nodeBefore && nodeAfter && nodeAfter !== nodeBefore && node.textContent === "")) return false;
	return editor
		.chain()
		.deleteNode("paragraph")
		.focus(position - 2)
		.run();
};

const headingAfterNode: KeyboardRule = ({ editor, nodePosition, node }): boolean => {
	const selection = editor.state.selection;

	if (nodePosition <= 3 || selection.from !== selection.to) return false;

	const isEmptyHeading = node.type.name === "heading" && !node.content.content.length;
	if (!(nodePosition === selection.from || isEmptyHeading)) return false;

	const doc = editor.state.doc;
	const headingPosition = isEmptyHeading ? nodePosition : nodePosition - 1;
	const headingNode = doc.nodeAt(headingPosition);
	if (!headingNode || headingNode.type.name !== "heading") return false;

	const nodeBefore = getNodeByPos(headingPosition - 1, doc, (node) => isTypeOf(node, ["note", "listItem"]));
	if (!nodeBefore?.node) return false;

	return editor.chain().toggleHeading({ level: headingNode.attrs.level }).run();
};

// Focus on before selectable block node if current node has content
const focusOnPrevousBlockNode: KeyboardRule = ({ editor, node: currentNode }) => {
	if (!currentNode.isTextblock && !currentNode.isText) return false;

	const { state: editorState } = editor;
	const { $anchor } = editorState.selection;

	const previousNodePos = Math.max(0, $anchor.pos - 2);
	const previousNode = editorState.doc.nodeAt(previousNodePos);

	if (!previousNode) return false;

	if (!isNodeSelectable(previousNode)) return false;

	if (!currentNode.textContent.length) return false;

	return editor.commands.setNodeSelection(previousNodePos);
};

const beforeArticleTitle: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { $anchor, from, to } = state.selection;

	if (from !== to) return false;

	const anchorParent = $anchor.parent;
	if (anchorParent !== state.doc.content.child(1)) return false;
	if (state.doc.childCount !== 2 || !anchorParent.isTextblock) return false;

	const offset = $anchor.parentOffset;

	if (offset) return false;

	if (anchorParent.childCount > 0) {
		let textContent = "";

		anchorParent.content.forEach((node) => {
			textContent += node.textContent;
		});

		const newTextNode = state.schema.text(textContent);

		const secondNodeStartPos = state.doc.firstChild.nodeSize;
		const secondNodeEndPos = secondNodeStartPos + anchorParent.nodeSize;

		return editor
			.chain()
			.deleteRange({ from: secondNodeStartPos, to: secondNodeEndPos })
			.insertContentAt(state.doc.firstChild.nodeSize - 1, newTextNode)
			.focus(state.doc.firstChild.nodeSize - 1 - newTextNode.content.size)
			.run();
	}

	return editor.commands.focus(state.doc.firstChild.nodeSize - 1);
};

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [betweenNoteOrCut, headingAfterNode, focusOnPrevousBlockNode, beforeArticleTitle],
	};
};

export default getBackspaceShortcuts;
