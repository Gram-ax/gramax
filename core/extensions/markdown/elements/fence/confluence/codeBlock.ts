import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const codeBlock: NodeConverter = (codeBlockNode) => {
	codeBlockNode.type = "code_block";
	codeBlockNode.attrs = {
		params: codeBlockNode?.attrs?.language,
	};
	return codeBlockNode;
};

export default codeBlock;
