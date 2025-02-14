import TableCell from "@tiptap/extension-table-cell";

const customTableCell = TableCell.extend({
	addAttributes() {
		return {
			aggregation: {
				default: null,
			},
			align: {
				default: null,
			},
			colspan: {
				default: 1,
			},
			rowspan: {
				default: 1,
			},
			colwidth: {
				default: null,
				parseHTML: (element) => {
					const colwidth = element.getAttribute("colwidth");
					const value = colwidth ? colwidth.split(",").map((width) => parseInt(width, 10)) : null;

					return value;
				},
			},
		};
	},
});

export default customTableCell;
