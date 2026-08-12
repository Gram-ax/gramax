import { TableCell } from "@tiptap/extension-table";
import { tableCell } from "../tableSchema";
import { createTableCellNodeView } from "./customTableCellNodeView";

const CustomTableCell = TableCell.extend({
	addNodeView() {
		return createTableCellNodeView();
	},
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
			...tableCell.attrs,
			aggregation: {
				default: null,
				parseHTML: (element) => element.getAttribute("aggregation") || null,
				renderHTML: (attributes) => ({
					aggregation: attributes.aggregation ?? null,
				}),
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
					return { colwidth: attributes.colwidth.join(",") };
				},
			},
		};
	},
});

export default CustomTableCell;
