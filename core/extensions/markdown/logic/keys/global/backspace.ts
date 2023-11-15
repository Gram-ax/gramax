import getDeepiestLastChild from "../../../elementsUtils/getDeepiesLastChild";
import getFocusNode from "../../../elementsUtils/getFocusNode";
import getNodeByPos from "../../../elementsUtils/getNodeByPos";
import getSelectedText from "../../../elementsUtils/getSelectedText";
import isTypeOf from "../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";
import { deleteBetweenTwoListItems } from "./delete";

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

const stickToLastListItem: KeyboardRule = ({ editor }) => {
	if (getSelectedText(editor.state)) return false;
	if (getFocusNode(editor.state, (n) => isTypeOf(n, "list_item")).node) return false;

	const { node } = getFocusNode(editor.state, (n) => isTypeOf(n, ["paragraph", "heading"]));
	const { node: listNode, position: listPosition } = getNodeByPos(
		editor.state.selection.anchor - 2,
		editor.state.doc,
		(n) => isTypeOf(n, ["bullet_list", "ordered_list"]),
	);
	if (!node || !listNode) return false;

	const { node: textNode, position: textNodePos } = getDeepiestLastChild(listNode, listPosition);
	const end = textNodePos + textNode.nodeSize;

	return editor
		.chain()
		.deleteNode(node.type.name)
		.insertContentAt(end, { type: "paragraph", content: node.content.toJSON() })
		.focus(textNode.textContent.length ? end : end - 1)
		.joinForward()
		.run();
};

const betweenTwoListItems: KeyboardRule = (props) => {
	if (!deleteBetweenTwoListItems(props)) return;
	return props.editor.commands.focus(props.editor.state.selection.anchor - 3);
};

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [betweenTwoListItems, betweenNoteOrCut, stickToLastListItem],
	};
};

export default getBackspaceShortcuts;
