import { MarkType } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

function getMarkPosition(state: EditorState, pos: number, markType: MarkType) {
	const $pos = state.doc.resolve(pos);

	const { parent, parentOffset } = $pos;
	const start = parent.childAfter(parentOffset);
	if (!start.node) return;

	const mark = start.node.marks.find((mark) => mark.type === markType);
	if (!mark) return;

	let startIndex = $pos.index();
	let from = $pos.start() + start.offset;
	let endIndex = startIndex + 1;
	let to = from + start.node.nodeSize;
	while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) {
		startIndex -= 1;
		from -= parent.child(startIndex).nodeSize;
	}
	while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) {
		to += parent.child(endIndex).nodeSize;
		endIndex += 1;
	}
	return { from, to, mark };
}

export default getMarkPosition;
