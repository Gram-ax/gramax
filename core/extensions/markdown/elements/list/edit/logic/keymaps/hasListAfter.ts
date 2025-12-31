import type { EditorState } from "@tiptap/pm/state";

export const hasListAfter = (editorState: EditorState, name: string, parentListTypes: string[]) => {
	const { $anchor } = editorState.selection;

	const nextNodePos = Math.max(0, $anchor.pos + 2);

	const nextNode = editorState.doc.resolve(nextNodePos).node();

	if (!nextNode || !parentListTypes.includes(nextNode.type.name)) {
		return false;
	}

	return true;
};
