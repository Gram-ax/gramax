import { isNodeSelectable } from "@ext/markdown/elementsUtils/isNodeSelectable";
import type KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";

// Focus on before selectable block node if current node has content
const focusOnPrevousBlockNode: KeyboardRule = ({ editor, node: currentNode }) => {
	if (!currentNode.isTextblock && !currentNode.isText) return false;

	const { state: editorState } = editor;
	const { $anchor } = editorState.selection;

	const previousNodePos = Math.max(0, $anchor.pos - 2);
	const previousNode = editorState.doc.nodeAt(previousNodePos);

	if (!previousNode) return false;

	if (!isNodeSelectable(previousNode)) return false;

	if (!currentNode.textContent.length) return false;

	return editor.commands.setNodeSelection(previousNodePos);
};

export default focusOnPrevousBlockNode;
