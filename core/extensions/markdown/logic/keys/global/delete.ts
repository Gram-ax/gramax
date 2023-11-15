import getFocusNode from "../../../elementsUtils/getFocusNode";
import getNodeByPos from "../../../elementsUtils/getNodeByPos";
import isTypeOf from "../../../elementsUtils/isTypeOf";
import KeyboardRule from "../../../elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "../../../elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

export const deleteBetweenTwoListItems: KeyboardRule = ({ editor }) => {
	if (getFocusNode(editor.state, (n) => isTypeOf(n, "list_item")).node) return false;

	const { state } = editor;
	const { node, position } = getFocusNode(state, (node) => node.type.name == "paragraph");
	if (!node) return false;

	const { node: nodeBefore } = getNodeByPos(position - 1, state.doc, (node) =>
		isTypeOf(node, ["bullet_list", "ordered_list"]),
	);
	const { node: nodeAfter } = getNodeByPos(position + 2, state.doc, (node) =>
		isTypeOf(node, ["bullet_list", "ordered_list"]),
	);

	if (node.textContent != "" || !nodeBefore || !nodeAfter) return false;

	const deleteParagraph = editor.chain().deleteCurrentNode().run();
	const liftListAfter =
		nodeAfter.type.name == "bullet_list"
			? editor.chain().toggleBulletList().toggleBulletList().run()
			: editor.chain().toggleOrderedList().toggleOrderedList().run();

	return deleteParagraph && liftListAfter;
};

const getDeleteShortcuts = (): KeyboardShortcut => {
	return {
		key: "Delete",
		rules: [deleteBetweenTwoListItems],
	};
};

export default getDeleteShortcuts;
