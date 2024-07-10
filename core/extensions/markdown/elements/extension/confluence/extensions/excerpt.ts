import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const excerpt: NodeConverter = (excerptNode) => {
	return {
		type: "paragraph",
		content: excerptNode.content,
	};
};

export default excerpt;
