import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const layoutSection: NodeConverter = (layoutSectionNode) => {
	return {
		type: "table",
		content: [
			{
				type: "tableRow",
				content: layoutSectionNode.content,
			},
		],
	};
};

export default layoutSection;
