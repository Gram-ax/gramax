import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const bulletList: NodeConverter = (bulletListNode) => {
	return {
		type: "bullet_list",
		attrs: { tight: false },
		content: bulletListNode.content,
	};
};

export default bulletList;