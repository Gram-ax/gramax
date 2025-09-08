import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const crateListItem: KeyboardRule = ({ editor, node, parentNode, nodePosition }) => {
	if (!parentNode || parentNode.type.name !== "listItem") return false;
	if (node.isTextblock || !node.isBlock) return false;

	const newListItemPos = Math.min(nodePosition + node.nodeSize, editor.state.doc.content.size - 1);
	return editor.chain().insertContentAt(newListItemPos, "<li><p></p></li>").run();
};

const notDeleteBlockNode: KeyboardRule = ({ parentNode }) => {
	if (!parentNode) return false;
	if (parentNode.type.spec.isolating) return false;
	if (parentNode.type.isInGroup(ElementGroups.listItem) || parentNode.type.isInGroup(ElementGroups.list)) {
		return false;
	}

	if (parentNode.childCount > 1) return false;
	if (parentNode.textContent.length > 0) return false;

	return true;
};

const getEnterShortcuts = (): KeyboardShortcut => {
	return { key: "Enter", rules: [crateListItem, notDeleteBlockNode] };
};

export default getEnterShortcuts;
