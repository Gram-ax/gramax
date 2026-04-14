import TableCell from "@tiptap/extension-table-cell";

const CustomTableCell = TableCell.extend({
	parseHTML() {
		return [
			{
				tag: "td",
			},
			{
				tag: "th",
			},
		];
	},

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
				renderHTML: (attributes) => {
					if (!attributes.colwidth) return {};
					const total = (attributes.colwidth as number[]).reduce((sum, w) => sum + w, 0);
					return { colwidth: attributes.colwidth.join(","), style: `--colwidth: ${total}px` };
				},
			},
		};
	},
});

export default CustomTableCell;
