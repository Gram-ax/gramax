import { Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import getNodeByPos from "./getNodeByPos";

const getFocusNode = (state: EditorState, filter?: (node: Node, parentNode?: Node) => boolean, isDeepest = true) => {
	return getNodeByPos(state.selection.anchor, state.doc, filter, isDeepest);
};

export default getFocusNode;
