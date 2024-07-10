import { Node } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";

const getFocusMarkFromSelection = (state: EditorState, typeName: string) => {
	const parent = state.selection.$from.parent;
	const position = state.selection.$from.pos;
	let mark = null;

	const find = (node: Node, pos: number) => {
		if (node.childCount)
			node.descendants((node: Node, offset: number) => {
				find(node, pos + offset + 1);
			});
		if (!node.isText) return true;
		const markIdx = node.marks.findIndex((mark) => mark.type.name == typeName);
		if (markIdx < 0) return true;
		mark = node.marks[markIdx];
		return false;
	};

	find(parent, position);

	return { mark, position: position };
};

export default getFocusMarkFromSelection;
