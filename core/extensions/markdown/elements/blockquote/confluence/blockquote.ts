import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const blockquote: NodeConverter = (blockquoteNode) => {
	return {
		type: "note",
		attrs: { title: "", type: "quote", collapsed: false },
		content: blockquoteNode.content,
	};
};

export default blockquote;
