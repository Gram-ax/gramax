import type KeyboardRule from "@ext/markdown/elementsUtils/keyboardShortcuts/model/KeyboardRule";

const dontMergeNotes: KeyboardRule = ({ editor }) => {
	const { state } = editor;
	const { $from, to } = state.selection;

	if ($from.pos !== to) return false;

	const parentNode = $from.node();
	if (!parentNode.isTextblock || $from.textOffset !== 0) return false;

	const previousNodePos = Math.max(0, $from.pos - 2);
	const nextNodePos = Math.min($from.pos + parentNode.content.size + 2, state.doc.content.size);

	const previousNode = state.doc.resolve(previousNodePos).node();
	const nextNode = state.doc.resolve(nextNodePos).node();

	if (!previousNode || !nextNode) return false;
	if (previousNode.type.name !== "note" || nextNode.type.name !== "note") return false;

	return editor
		.chain()
		.deleteRange({ from: $from.pos - 1, to: $from.pos + parentNode.content.size + 1 })
		.insertContentAt(previousNodePos, parentNode.content)
		.focus(previousNodePos)
		.run();
};

export default dontMergeNotes;
