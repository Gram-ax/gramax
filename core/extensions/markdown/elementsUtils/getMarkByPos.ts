import { EditorState } from "@tiptap/pm/state";

const getMarkByPos = (state: EditorState, pos: number, markType: string) => {
	const resolvedPos = state.doc.resolve(pos);
	return resolvedPos.nodeAfter.marks.find((mark) => mark.type.name === markType);
};

export default getMarkByPos;
