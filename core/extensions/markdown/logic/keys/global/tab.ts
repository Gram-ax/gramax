import { listTypes } from "@ext/markdown/elements/joinLists/joinLists";
import KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";
import KeyboardShortcut from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardShortcut";

const blockToListItem: KeyboardRule = ({ editor, node, parentNode, nodePosition }) => {
	if (!parentNode || parentNode.type.name === "listItem") return false;
	if (node.isTextblock || !node.isBlock || node.type.name === "code_block") return false;
	const $pos = editor.state.doc.resolve(nodePosition);

	const listItem = editor.schema.nodes.listItem.create(null, node);

	const checkPos = editor.state.doc.resolve(nodePosition);
	const previousNodePos = editor.state.doc.resolve(
		nodePosition - checkPos.textOffset - checkPos.parent.child(checkPos.index() - 1).nodeSize + 1,
	);

	if (listTypes.includes(previousNodePos.parent.type.name)) {
		return editor
			.chain()
			.deleteSelection()
			.insertContentAt(previousNodePos.pos + previousNodePos.parent.content.size, listItem)
			.setMeta("ignoreDeleteNode", true)
			.setNodeSelection(previousNodePos.pos + previousNodePos.parent.nodeSize - 1)
			.run();
	}

	const nextPos = nodePosition - checkPos.textOffset + checkPos.parent.child(checkPos.index()).nodeSize + 1;
	const nextNodePos = editor.state.doc.resolve(Math.max(Math.min(nextPos, editor.state.doc.content.size - 1), 0));

	if (listTypes.includes(nextNodePos?.parent.type.name)) {
		return editor
			.chain()
			.deleteSelection()
			.insertContentAt(nextNodePos.pos - 1, listItem)
			.setMeta("ignoreDeleteNode", true)
			.setNodeSelection(nextNodePos.pos)
			.run();
	}

	let parent;
	const parentIsList = listTypes.includes(parentNode.type.name);

	if (!parentNode || !parentIsList) {
		parent = editor.schema.nodes.bulletList.create(null, listItem);
	} else {
		parent = listItem;
	}

	const clampPos = Math.max(Math.min($pos.pos, editor.state.doc.content.size - 1), 0);
	return editor.chain().deleteSelection().insertContentAt(clampPos, parent).setMeta("ignoreDeleteNode", true).run();
};

const getTabShortcuts = (): KeyboardShortcut => {
	return { key: "Tab", rules: [blockToListItem] };
};

export default getTabShortcuts;
