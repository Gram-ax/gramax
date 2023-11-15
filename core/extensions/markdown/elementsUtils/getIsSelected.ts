import { EditorState } from "prosemirror-state";

const getIsSelected = (state: EditorState) => {
	return state.selection?.content().content.size !== 0;
};

export default getIsSelected;
