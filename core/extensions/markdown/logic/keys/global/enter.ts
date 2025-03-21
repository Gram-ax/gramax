import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const crateListItem: KeyboardRule = ({ editor, node, parentNode, nodePosition }) => {
	if (!parentNode || parentNode.type.name !== "listItem") return false;
	if (node.isTextblock || !node.isBlock) return false;

	const newListItemPos = Math.min(nodePosition + node.nodeSize, editor.state.doc.content.size - 1);
	return editor.chain().insertContentAt(newListItemPos, "<li><p></p></li>").run();
};

const getEnterShortcuts = (): KeyboardShortcut => {
	return { key: "Enter", rules: [crateListItem] };
};

export default getEnterShortcuts;
