import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import type { NodeSpec } from "@tiptap/pm/model";

const table: NodeSpec = {
	group: `${ElementGroups.block} ${ElementGroups.listItemContent}`,
	content: "tableRow+",
	attrs: {
		header: { default: TableHeaderTypes.ROW },
		sortingOrder: { default: null },
	},
};

const tableRow: NodeSpec = {
	group: "block",
	content: "tableCell*",
	attrs: {
		initialOrder: { default: null },
	},
};

const tableCell: NodeSpec = {
	group: "block",
	content: "block+",
	attrs: {
		aggregation: { default: null },
		colspan: { default: 1 },
		rowspan: { default: 1 },
		colwidth: { default: null },
		align: { default: null },
		filter: { default: null },
		sort: { default: null },
	},
};

export { table, tableCell, tableRow };
