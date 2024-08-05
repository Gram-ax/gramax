import { EditorView } from "prosemirror-view";

const preventBackspace = (view: EditorView, event: KeyboardEvent): boolean => {
	if (event.key !== "Backspace") return;

	const { state } = view;
	const { $from, empty } = state.selection;

	if ($from.parentOffset !== 0 || !empty) return;

	const indexBefore = $from.index($from.depth - 1) - 1;
	const nodeBefore = indexBefore >= 0 ? $from.node($from.depth - 1).child(indexBefore) : null;

	if (nodeBefore && nodeBefore.type.name === "tabs") return true;
};

export default preventBackspace;
