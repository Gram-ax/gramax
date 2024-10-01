import { Mark } from "prosemirror-model";
import { EditorState } from "prosemirror-state";

const getFocusMark = (state: EditorState, typeName: string) => {
	let mark: Mark = null;
	let position: number = null;
	const anchor = state.selection.anchor;

	const stack = [{ node: state.doc, pos: 0 }];

	do {
		const { node, pos } = stack.pop();

		if (node.childCount > 0) {
			node.forEach((child, offset) => {
				stack.push({ node: child, pos: pos + offset + 1 });
			});
		}

		if (!node.isText) continue;

		if (anchor >= pos && anchor <= pos + node.nodeSize) {
			const markIdx = node.marks.findIndex((mark) => mark.type.name === typeName);
			if (markIdx >= 0) {
				mark = node.marks[markIdx];
				position = pos;
				break;
			}
		}
	} while (stack.length > 0);

	return { mark, position };
};

export default getFocusMark;
