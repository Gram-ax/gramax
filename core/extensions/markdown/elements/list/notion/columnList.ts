import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const columnList: NotionNodeConverter = (columnListNode) => {
	return {
		type: "table",
		content: [
			{
				type: "tableRow",
				content: columnListNode.content,
			},
		],
	};
};

export default columnList;
