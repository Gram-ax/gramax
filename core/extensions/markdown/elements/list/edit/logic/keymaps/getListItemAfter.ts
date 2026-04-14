import type { Node } from "@tiptap/pm/model";
import type { EditorState } from "@tiptap/pm/state";

export const getListItemAfter = (typeOrName: string, state: EditorState): Node | null => {
	const { $anchor } = state.selection;

	const targetPos = state.doc.resolve($anchor.pos - $anchor.parentOffset - 2);

	if (targetPos.index() === targetPos.parent.childCount - 1) {
		return null;
	}

	const nextNode = targetPos.parent.maybeChild(targetPos.index() + 1);

	if (!nextNode || nextNode.type.name !== typeOrName) {
		return null;
	}

	return nextNode;
};
