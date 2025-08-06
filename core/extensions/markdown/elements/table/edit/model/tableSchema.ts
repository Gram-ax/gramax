import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import ElementGroups from "@ext/markdown/core/element/ElementGroups";

const table = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: "tableRow+",
	attrs: {
		header: { default: TableHeaderTypes.ROW },
	},
};

const col = {
	attrs: {
		width: { default: null },
	},
};

const colgroup = {
	content: "col+",
};

const tableRow = {
	group: "block",
	content: "tableCell*",
};

const tableCell = {
	group: "block",
	content: "block+",
	attrs: {
		aggregation: { default: null },
		colspan: { default: 1 },
		rowspan: { default: 1 },
		colwidth: { default: null },
		align: { default: null },
	},
};

export { table, tableRow, tableCell, colgroup, col };
