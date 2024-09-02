import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const codeBlockLowlight: NodeConverter = (node) => {
	node.type = "code_block";
	node.attrs = { params: node?.attrs?.language };

	return node;
};

export default codeBlockLowlight;
