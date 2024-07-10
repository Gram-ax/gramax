import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const orderedList: NodeConverter = (orderedListNode) => {
	return {
		type: "ordered_list",
		attrs: { tight: false },
		content: orderedListNode.content,
	};
};

export default orderedList;
