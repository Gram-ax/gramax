import CellComponent from "@ext/markdown/elements/table/edit/components/CellComponent";
import TableCell from "@tiptap/extension-table-cell";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { tableCell } from "../tableSchema";

const CustomTableCell = TableCell.extend({
	addNodeView() {
		return ReactNodeViewRenderer(CellComponent, {
			as: "td",
			attrs: ({ HTMLAttributes }) => {
				const attrs = Object.entries(HTMLAttributes).filter(([, value]) => value);
				const newAttrs = {};
				attrs.forEach(([name, value]) => {
					newAttrs[name] = value;
				});
				return newAttrs;
			},
			stopEvent: () => false,
		});
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
