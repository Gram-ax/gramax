import { Fragment, Slice } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";

export const pasteBetweenMark = (slice: Slice, state: EditorState): Slice => {
	const { from, to } = state.selection;

	if (from !== to) return slice;
	if (slice.content.childCount !== 1) return slice;

	const firstChild = slice.content.firstChild;
	if (!firstChild.isTextblock || firstChild.type.spec.code) return slice;

	const newContent = [];
	const activeMarks = state.doc.resolve(Math.min(Math.max(from + 1, to - 1, 0), state.doc.content.size)).marks();

	for (let i = 0; i < firstChild.childCount; i++) {
		const child = firstChild.child(i);
		if (child.type.name === "text") newContent.push(state.schema.text(child.text, activeMarks));
		else newContent.push(child);
	}

	return new Slice(
		Fragment.fromArray([state.schema.nodes.paragraph.create(null, newContent)]),
		slice.openStart,
		slice.openEnd,
	);
};
