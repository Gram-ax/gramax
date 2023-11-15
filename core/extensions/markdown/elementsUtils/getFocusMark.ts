import { Mark, Node } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

const getFocusMark = (state: EditorState, typeName: string) => {
	let mark: Mark = null;
	let position: number = null;
	const anchor = state.selection.anchor;
	const find = (node: Node, pos: number) => {
		if (node.childCount)
			node.descendants((node: Node, offset: number) => {
				find(node, pos + offset + 1);
			});
		if (!node.isText) return true;
		if (!(anchor >= pos && anchor <= pos + node.nodeSize)) return true;
		const markIdx = node.marks.findIndex((mark) => mark.type.name == typeName);
		if (markIdx < 0) return true;
		mark = node.marks[markIdx];
		position = pos;
		return false;
	};
	find(state.doc, 0);
	return { mark, position };
};

export default getFocusMark;
