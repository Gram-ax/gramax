import NodeTransformerFunc from "../../../../core/edit/logic/Prosemirror/NodeTransformerFunc";

const paragraphNodeTransformer: NodeTransformerFunc = (node) => {
	if (node?.type !== "paragraph") return;
	if (node?.content?.length !== 1) return;
	if (node?.content[0].type !== "text") return;
	if (node?.content[0]?.text == " ") delete node.content;
	return null;
};

export default paragraphNodeTransformer;
