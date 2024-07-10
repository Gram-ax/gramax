import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const blockquote: NodeConverter = (blockquoteNode) => {
	return {
        type: "note",
        attrs: { title: "", type: "quote", collapsed: false },
        content: blockquoteNode.content,
    };
};

export default blockquote;
