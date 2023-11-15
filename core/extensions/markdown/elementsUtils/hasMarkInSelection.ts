import { EditorState } from "prosemirror-state";

function hasMarkInSelection(state: EditorState, markName?: string): boolean {
	const { from, to } = state.selection;
	let markFound = false;
	state.doc.nodesBetween(from, to, (node) => {
		if (node.isText && (markName ? node.marks.some((mark) => mark.type.name === markName) : node.marks?.length)) {
			markFound = true;
		}
	});

	return markFound;
}

export default hasMarkInSelection;
