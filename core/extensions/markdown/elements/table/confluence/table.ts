import NodeConverter from "@ext/confluence/actions/Import/logic/NodeConverter";

const table: NodeConverter = (tableNode) => {
	return {
		type: "table",
		content: tableNode.content,
	};
};

export default table;
