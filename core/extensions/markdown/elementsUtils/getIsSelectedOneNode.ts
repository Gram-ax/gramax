import { EditorState } from "prosemirror-state";

const getIsSelectedOneNode = (state: EditorState) => {
	const { $from, $to } = state.selection;
	const selectOneNode = $from.node() === $to.node();

	return state.selection?.content().content.size !== 0 && selectOneNode;
};

export default getIsSelectedOneNode;
