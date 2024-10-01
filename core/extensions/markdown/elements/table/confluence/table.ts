import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const table: NodeConverter = (tableNode) => {
	return {
		type: "table",
		content: tableNode.content,
	};
};

export default table;
