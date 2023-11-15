import NodeTransformerFunc from "../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";
import { transformNodeToModel } from "./Transformer";

const commentNodeTransformer: NodeTransformerFunc = async (node, previousNode, nextNode, context, count) => {
	if (node?.type == "comment_old") return { isSet: true, value: null };
	if (nextNode?.type !== "comment_old") return;
	const commentBlock = await transformNodeToModel(nextNode, context);
	let isSet = false;
	const findText = (node) => {
		if (isSet) return;
		for (const n of node.content) {
			if (n.type == "text") {
				n.marks = [...(n.marks ?? []), { type: "comment", attrs: { count, ...commentBlock } }];
				isSet = true;
				return;
			}
			if (n.content) findText(n);
		}
	};

	findText(node);

	return { isSet: true, value: node };
};

export default commentNodeTransformer;
