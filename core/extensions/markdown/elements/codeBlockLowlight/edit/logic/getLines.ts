import { EditorState } from "prosemirror-state";

function getLines(state: EditorState) {
	const { $from, $to } = state.selection;
	let startPosition = $from.pos;
	const parentOffset = $from.parentOffset;
	for (let i = 0; i < parentOffset; i++) {
		const char = state.doc.textBetween(startPosition - i, startPosition - i + 1);
		if (char === "\n") {
			startPosition = startPosition - i + 1;
			i = parentOffset;
		}
		if (i === parentOffset - 1) startPosition = startPosition - i - 1;
	}
	const textBetween = state.doc.textBetween(startPosition, $to.pos);
	return { lines: textBetween.split("\n"), startPosition };
}

export { getLines };
