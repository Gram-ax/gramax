import type { EditorState, Transaction } from "@tiptap/pm/state";

export const headingPaste = (
	transactions: Transaction[],
	oldState: EditorState,
	newState: EditorState,
): Transaction => {
	const isPaste = transactions.some((tr) => tr.getMeta("paste") || tr.getMeta("uiEvent") === "paste");
	if (!isPaste || newState.doc.childCount < 2) return null;

	const firstNode = newState.doc.firstChild;
	const secondNode = newState.doc.child(1);

	const cursorWasInTitle =
		oldState.doc.childCount > 0 && oldState.selection.$from.node(1) === oldState.doc.firstChild;

	if (firstNode.content.size === 0 && secondNode.isTextblock && cursorWasInTitle) {
		const tr = newState.tr;
		tr.insert(1, secondNode.content);
		tr.delete(
			firstNode.nodeSize + secondNode.content.size,
			firstNode.nodeSize + secondNode.nodeSize + secondNode.content.size,
		);
		return tr;
	}

	return null;
};
