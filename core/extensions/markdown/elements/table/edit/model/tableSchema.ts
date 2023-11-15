const table = {
	group: "block",
	content: "tableRow+",
};

const tableRow = {
	group: "block",
	content: "(tableCell | tableHeader)*",
};

const tableCell = {
	group: "block",
	content: "block+",
	attrs: {
		colspan: { default: 1 },
		rowspan: { default: 1 },
		colwidth: { default: null },
	},
};

const tableHeader = {
	group: "block",
	content: "block+",
	attrs: {
		colspan: { default: 1 },
		rowspan: { default: 1 },
		colwidth: { default: null },
	},
};

export { table, tableRow, tableCell, tableHeader };
