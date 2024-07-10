import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

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
