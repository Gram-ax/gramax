import NodeConverter from "@ext/confluence/core/cloud/model/NodeConverter";

const listItem: NodeConverter = (listItemNode) => {
	return {
		type: "listItem",
		content: listItemNode.content,
	};
};

export default listItem;
