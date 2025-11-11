import { listTypes } from "@ext/markdown/elements/joinLists/joinLists";
import getNodeByPos from "../../../elementsUtils/getNodeByPos";
import isTypeOf from "../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import getDeepiestLastChild from "@ext/markdown/elementsUtils/getDeepiesLastChild";

const betweenNoteOrCut: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { node, position } = getNodeByPos(state.selection.anchor, state.doc, (node) => node.type.name == "paragraph");
	const { node: nodeBefore } = getNodeByPos(position - 1, state.doc, (node) => isTypeOf(node, ["note", "cut"]));
	const { node: nodeAfter } = getNodeByPos(position + 2, state.doc, (node) => isTypeOf(node, ["note", "cut"]));

	if (!(nodeBefore && nodeAfter && nodeAfter !== nodeBefore && node.textContent == "")) return false;
	return editor
		.chain()
		.deleteNode("paragraph")
		.focus(position - 2)
		.run();
};

const headingAfterNode: KeyboardRule = ({ editor, nodePosition, node }): boolean => {
	const selection = editor.state.selection;

	if (nodePosition <= 3 || selection.from !== selection.to) return;

	const isEmptyHeading = node.type.name === "heading" && !node.content.content.length;
	if (!(nodePosition === selection.from || isEmptyHeading)) return;

	const doc = editor.state.doc;
	const headingPosition = isEmptyHeading ? nodePosition : nodePosition - 1;
	const headingNode = doc.nodeAt(headingPosition);
	if (!headingNode || headingNode.type.name !== "heading") return;

	const nodeBefore = getNodeByPos(headingPosition - 1, doc, (node) => isTypeOf(node, ["note", "listItem"]));
	if (!nodeBefore) return;

	editor.chain().toggleHeading({ level: headingNode.attrs.level }).run();
};

const gotoEndOfList: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { selection } = state;
	if (!selection.empty) return;
	if (selection.$from.textOffset !== 0) return;

	const { node, position, parentNode } = getNodeByPos(
		state.selection.anchor,
		state.doc,
		(node) => node.type.name == "paragraph",
	);
	if (!node) return;
	if (selection.$anchor.pos !== position + 1) return;

	const parentNodeIsList = listTypes.includes(parentNode.type.name);
	const parentNodeIsListItem = parentNode.type.name === "listItem";
	if (parentNodeIsList || parentNodeIsListItem) return;

	const { node: nodeBefore, position: nodeBeforePosition } = getNodeByPos(position - 1, state.doc, (node) =>
		isTypeOf(node, listTypes),
	);
	if (!nodeBefore || !listTypes.includes(nodeBefore.type.name)) return;
	const deepiestLastChild = getDeepiestLastChild(nodeBefore, nodeBeforePosition);
	if (!deepiestLastChild?.node) return;

	const insertPosition = Math.min(
		Math.max(deepiestLastChild.position + deepiestLastChild.node.nodeSize, 0),
		state.doc.content.size,
	);
	return editor
		.chain()
		.insertContentAt(insertPosition, node.content)
		.deleteRange({ from: position, to: position + node.nodeSize })
		.focus(insertPosition)
		.run();
};

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [betweenNoteOrCut, headingAfterNode, gotoEndOfList],
	};
};

export default getBackspaceShortcuts;
