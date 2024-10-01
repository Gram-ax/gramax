import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";
import mediaInline from "@ext/markdown/elements/attachment/confluence/mediaInline";

const mediaGroup: NodeConverter = async (mediaGroupNode, ctx) => {
	const content = [];
	for (const node of mediaGroupNode.content) {
		const convertedNode = await mediaInline(node, ctx);
		content.push(Array.isArray(convertedNode) ? convertedNode[1] || convertedNode[0] : convertedNode);
	}

	return {
		type: "paragraph",
		content,
	};
};

export default mediaGroup;
