import TableComponent from "@ext/markdown/elements/table/edit/components/TableComponent";
import aggregationPlugin from "@ext/markdown/elements/table/edit/model/aggregationPlugin/plugin";
import { columnResizing } from "@ext/markdown/elements/table/edit/model/columnResizing/columnResizing";
import decorationPlugin from "@ext/markdown/elements/table/edit/model/decorationPlugin/plugin";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import Table from "@tiptap/extension-table";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TableView } from "prosemirror-tables";

const CustomTable = Table.extend({
	addAttributes() {
		return {
			header: { default: TableHeaderTypes.ROW },
		};
	},

	addNodeView() {
		return ReactNodeViewRenderer(TableComponent, {
			contentDOMElementTag: "tbody",
			ignoreMutation: () => true,
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
			decorationPlugin,
			aggregationPlugin,
			...this.parent().filter((plagin: any) => plagin.key !== "tableColumnResizing$"),
		];
	},
}).configure({
	resizable: true,
});

export default CustomTable;
