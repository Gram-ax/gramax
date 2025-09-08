import NodeTransformerFunc from "@ext/markdown/core/edit/logic/Prosemirror/NodeTransformerFunc";
import { COMMENT_INLINE_NODE_TYPES } from "@ext/markdown/elements/comment/edit/model/consts";

const inlineNodeTransformers: NodeTransformerFunc = (node) => {
	const commentMark = node.marks?.find((mark) => mark.type === "comment");
	if (commentMark && !COMMENT_INLINE_NODE_TYPES.includes(node.type)) {
		return { isSet: false, value: { ...node, marks: node.marks?.filter((mark) => mark.type !== "comment") } };
	}

	if (!COMMENT_INLINE_NODE_TYPES.includes(node.type) || !commentMark) return null;

	const newNode = {
		...node,
		attrs: { ...node.attrs, comment: { id: commentMark.attrs.id } },
		marks: node.marks?.filter((mark) => mark.type !== "comment"),
	};

	return { isSet: true, value: newNode };
};

export default inlineNodeTransformers;
