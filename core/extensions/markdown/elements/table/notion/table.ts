import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const table: NotionNodeConverter = (tableNode) => {
	const content = tableNode.content.map((row, index) => ({
		...row,
		columnHeader: index === 0 && tableNode.table.has_column_header,
		rowHeader: tableNode.table.has_row_header,
	}));

	return {
		type: "table",
		content: content,
	};
};

export default table;
