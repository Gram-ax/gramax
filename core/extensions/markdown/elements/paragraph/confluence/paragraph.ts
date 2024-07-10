import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const paragraph: NodeConverter = (paragraphNode) => {
	return {
		type: "paragraph",
		content: paragraphNode.content,
	};
};

export default paragraph;
