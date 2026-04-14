import getNodeByPos from "@ext/markdown/elementsUtils/getNodeByPos";
import isTypeOf from "@ext/markdown/elementsUtils/isTypeOf";
import type KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";

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

export default betweenNoteOrCut;
