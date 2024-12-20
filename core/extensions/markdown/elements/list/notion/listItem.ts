import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const listItem: NotionNodeConverter = (listItemNode) => {
	return {
		type: "listItem",
		content: listItemNode.content,
	};
};

export default listItem;
