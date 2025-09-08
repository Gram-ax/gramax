import TableComponent from "@ext/markdown/elements/table/edit/components/TableComponent";
import aggregationPlugin from "@ext/markdown/elements/table/edit/model/aggregationPlugin/plugin";
import { columnResizing } from "@ext/markdown/elements/table/edit/model/columnResizing/columnResizing";
import decorationPlugin from "@ext/markdown/elements/table/edit/model/decorationPlugin/plugin";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import Table from "@tiptap/extension-table";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { table } from "../tableSchema";
import { deleteRow, deleteColumn, TableView, selectedRect, isInTable } from "prosemirror-tables";

const CustomTable = Table.extend({
	...getExtensionOptions({ schema: table, name: Table.name }),
	addNodeView() {
		return ReactNodeViewRenderer(TableComponent, {
			contentDOMElementTag: "tbody",
			ignoreMutation: ({ mutation }) => {
				if (mutation.type === "selection") return false;
				return true;
			},
		});
	},
	addCommands() {
		return {
			...this.parent(),
			deleteColumn:
				() =>
				({ state, dispatch, chain }) => {
					return deleteColumn(state, dispatch) || chain().deleteTable().run();
				},
			deleteRow:
				() =>
				({ state, dispatch, chain }) => {
					return deleteRow(state, dispatch) || chain().deleteTable().run();
				},
			addRowAfter: () => (props) => {
				if (!isInTable(props.state)) return;
				const { tr, state } = props;
				const rect = selectedRect(state);

				const result = this.parent().addRowAfter()(props);
				tr.steps.forEach((step) => {
					if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
						const { from, to } = step;
						const sliceSizeChange = step.slice.size - (to - from);

						if (sliceSizeChange === 0) return;
						let newCellPos = from + 1;
						const tableRow = tr.doc.nodeAt(step.from);
						tableRow.content.content.forEach((cell, i) => {
							const oldCellPos = rect.tableStart + rect.map.map[rect.top * rect.map.width + i];
							const oldCell = tr.doc.nodeAt(oldCellPos);
							const newCell = tr.doc.nodeAt(newCellPos);
							tr.setNodeMarkup(newCellPos, null, {
								...newCell.attrs,
								align: oldCell.attrs["align"],
							});
							newCellPos += cell.nodeSize;
						});
					}
				});
				return result;
			},
			addRowBefore: () => (props) => {
				if (!isInTable(props.state)) return;
				const { tr, state } = props;
				const rect = selectedRect(state);

				const result = this.parent().addRowBefore()(props);
				tr.steps.forEach((step) => {
					if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
						const { from, to } = step;
						const sliceSizeChange = step.slice.size - (to - from);

						if (sliceSizeChange === 0) return;
						let newCellPos = from + 1;
						const tableRow = tr.doc.nodeAt(step.from);

						tableRow.content.content.forEach((cell, i) => {
							const oldCellPos =
								rect.tableStart + rect.map.map[rect.top * rect.map.width + i] + tableRow.nodeSize;
							const oldCell = tr.doc.nodeAt(oldCellPos);
							const newCell = tr.doc.nodeAt(newCellPos);
							tr.setNodeMarkup(newCellPos, null, {
								...newCell.attrs,
								align: oldCell.attrs["align"],
							});
							newCellPos += cell.nodeSize;
						});
					}
				});
				return result;
			},
		};
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
