import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const paragraph: NodeConverter = (paragraphNode) => {
	return {
		type: "paragraph",
		content: paragraphNode.content,
	};
};

export default paragraph;
