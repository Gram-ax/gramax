import type { EditorState } from "@tiptap/pm/state";

export const hasListItemBefore = (typeOrName: string, state: EditorState): boolean => {
	const { $anchor } = state.selection;

	const TargetPos = state.doc.resolve($anchor.pos - 2);

	if (TargetPos.index() === 0) {
		return false;
	}

	if (TargetPos.nodeBefore?.type.name !== typeOrName) {
		return false;
	}

	return true;
};
