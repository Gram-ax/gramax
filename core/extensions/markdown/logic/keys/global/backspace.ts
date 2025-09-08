import getNodeByPos from "../../../elementsUtils/getNodeByPos";
import isTypeOf from "../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

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
	if (headingNode.type.name !== "heading") return;

	const nodeBefore = getNodeByPos(headingPosition - 1, doc, (node) => isTypeOf(node, ["note", "listItem"]));
	if (!nodeBefore) return;

	editor.chain().toggleHeading({ level: headingNode.attrs.level }).run();
};

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [betweenNoteOrCut, headingAfterNode],
	};
};

export default getBackspaceShortcuts;
