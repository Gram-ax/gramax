import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const expand: NodeConverter = (expandNode) => {
	return {
		type: "note",
		attrs: { title: expandNode?.attrs?.title || "Подробнее", type: "info", collapsed: true },
		content: expandNode.content,
	};
};

export default expand;
