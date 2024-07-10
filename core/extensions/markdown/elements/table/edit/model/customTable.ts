import TableComponent from "@ext/markdown/elements/table/edit/components/TableComponent";
import { columnResizing } from "@ext/markdown/elements/table/edit/model/columnResizing/columnResizing";
import Table from "@tiptap/extension-table";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TableView } from "prosemirror-tables";

const CustomTable = Table.extend({
	addNodeView() {
		return ReactNodeViewRenderer(TableComponent, {
			contentDOMElementTag: "tbody",
		});
	},

	addProseMirrorPlugins() {
		const isResizable = this.options.resizable && this.editor.isEditable;
		return [
			...(isResizable
				? [
						columnResizing({
							handleWidth: this.options.handleWidth,
							cellMinWidth: this.options.cellMinWidth,
							View: TableView,
							lastColumnResizable: this.options.lastColumnResizable,
						}),
				  ]
				: []),
			...this.parent().filter((plagin: any) => plagin.key !== "tableColumnResizing$"),
		];
	},
}).configure({
	resizable: true,
});

export default CustomTable;
