import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const tableRow: NotionNodeConverter = (tableRowNode) => {
	const cells = tableRowNode.table_row?.cells.map((cell, index) => ({
		type: (index === 0 && tableRowNode?.rowHeader) || tableRowNode.columnHeader ? "tableHeader" : "tableCell",
		content: cell,
	}));
	
	return {
		type: "tableRow",
		content: cells,
	};
};

export default tableRow;
