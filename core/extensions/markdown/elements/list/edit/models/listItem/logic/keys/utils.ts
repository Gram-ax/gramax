import { Node as ProseMirrorNode } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

export const isFocusBeforeList = (state: EditorState, node: ProseMirrorNode, position: number): boolean => {
	// нужно найти ноду, после которой будет bullet или ordered list
	// node.descendants((node, pos, parent, index) => {
	// 	console.log(node);
	// });
	return state.selection.anchor == position + node.firstChild.content.size + 2;
};

export const isFocusOnStartListNode = (state: EditorState, nodePosition: number): boolean => {
	return state.selection.anchor == nodePosition + 2;
};
