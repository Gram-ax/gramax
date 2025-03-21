import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const liftListItem: KeyboardRule = ({ editor, parentNode, nodePosition, node }) => {
	if (!parentNode || parentNode.type.name !== "listItem") return false;
	if (node.isTextblock || !node.isBlock) return false;

	if (editor.can().liftListItem(parentNode.type)) {
		return editor
			.chain()
			.liftListItem(parentNode.type)
			.setMeta("ignoreDeleteNode", true)
			.focus(nodePosition + 1)
			.run();
	}
};

const getShiftTabShortcuts = (): KeyboardShortcut => {
	return { key: "Shift-Tab", rules: [liftListItem] };
};

export default getShiftTabShortcuts;
