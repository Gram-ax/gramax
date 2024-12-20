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

const getBackspaceShortcuts = (): KeyboardShortcut => {
	return {
		key: "Backspace",
		rules: [betweenNoteOrCut],
	};
};

export default getBackspaceShortcuts;
