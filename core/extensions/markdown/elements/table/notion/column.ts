import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const column: NotionNodeConverter = (columnNode) => {
	return {
		type: "tableCell",
		content: columnNode.content,
	};
};

export default column;
