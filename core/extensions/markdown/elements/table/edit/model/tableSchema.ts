import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";

const table = {
	group: "block",
	content: "tableRow+",
	attrs: {
		header: { default: TableHeaderTypes.ROW },
	},
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

const tableHeader = {
	group: "block",
	content: "block+",
	attrs: {
		colspan: { default: 1 },
		rowspan: { default: 1 },
		colwidth: { default: null },
		align: { default: null },
	},
};

export { table, tableRow, tableCell, tableHeader };
