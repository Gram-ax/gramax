import { EditorState } from "@tiptap/pm/state";

const getNearestNodeWithSameCommentId = (state: EditorState, position: number, commentId: string) => {
	const $pos = state.doc.resolve(position);
	const parentNode = $pos.node();
	const parentNodeStartPos = $pos.start();

	let range = null;
	parentNode.forEach((node, offset) => {
		if (range) return;

		if (node.attrs.comment?.id && node.attrs.comment.id === commentId) {
			range = {
				from: parentNodeStartPos + offset,
				to: parentNodeStartPos + offset + node.nodeSize,
			};
		}

		if (node.marks.find((mark) => mark.type.name === "comment" && mark.attrs?.id === commentId)) {
			range = {
				from: parentNodeStartPos + offset,
				to: parentNodeStartPos + offset + node.nodeSize,
			};
		}
	});

	return range;
};

export default getNearestNodeWithSameCommentId;
