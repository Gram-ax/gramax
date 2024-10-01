import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const excerpt: NodeConverter = (excerptNode) => {
	return {
		type: "paragraph",
		content: excerptNode.content,
	};
};

export default excerpt;
