import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const bulletList: NodeConverter = (bulletListNode) => {
	return {
		type: "bulletList",
		attrs: { tight: false },
		content: bulletListNode.content,
	};
};

export default bulletList;
