import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const decisionList: NodeConverter = (decisionListNode) => {
	return {
		type: "bulletList",
		attrs: { tight: false },
		content: decisionListNode.content,
	};
};

export default decisionList;
