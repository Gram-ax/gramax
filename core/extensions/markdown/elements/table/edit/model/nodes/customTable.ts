import TableComponent from "@ext/markdown/elements/table/edit/components/TableComponent";
import {
	updateSortingOrderOnAddCol,
	updateSortingOrderOnDeleteCol,
} from "@ext/markdown/elements/table/edit/logic/sortAndFilter/updateSortingOrder";
import aggregationPlugin from "@ext/markdown/elements/table/edit/model/aggregationPlugin/plugin";
import { columnResizing } from "@ext/markdown/elements/table/edit/model/columnResizing/columnResizing";
import decorationPlugin from "@ext/markdown/elements/table/edit/model/decorationPlugin/plugin";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { Table } from "@tiptap/extension-table";
import type { Attrs } from "@tiptap/pm/model";
import type { Plugin } from "@tiptap/pm/state";
import { ReplaceAroundStep, ReplaceStep } from "@tiptap/pm/transform";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { deleteColumn, deleteRow, isInTable, selectedRect, TableView } from "prosemirror-tables";
import { table } from "../tableSchema";
export const COL_MIN_WIDTH = 48; // CELL_MIN_WIDTH

const CustomTable = Table.extend({
	...getExtensionOptions({ schema: table, name: Table.name }),
	addNodeView() {
		return ReactNodeViewRenderer(TableComponent, {
			contentDOMElementTag: "tbody",
			ignoreMutation: ({ mutation }) => {
				if (mutation.type === "selection") return false;
				return true;
			},
			update: ({ oldNode, newNode, updateProps }) => {
				if (oldNode === newNode) return true;
				updateProps();
				return true;
			},
		});
	},
	addCommands() {
		return {
			...this.parent(),
			deleteColumn:
				() =>
				({ state, dispatch, chain, tr }) => {
					if (!isInTable(state)) return false;

					const rect = selectedRect(state);
					const colsToRemove = [];

					for (let i = rect.right - 1; i >= rect.left; i--) colsToRemove.push(i);

					const result = deleteColumn(state, dispatch) || chain().deleteTable().run();
					if (result) updateSortingOrderOnDeleteCol(tr, colsToRemove);

					return result;
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
							if (!oldCell) return;
							tr.setNodeMarkup(newCellPos, null, {
								...newCell.attrs,
								align: oldCell.attrs.align || "",
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
				const isFirstRow = rect.top === 0;

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
							if (!oldCell) return;

							const newAttrs: { -readonly [P in keyof Attrs]: Attrs[P] } = {
								...newCell.attrs,
								align: oldCell.attrs.align || "",
							};

							if (isFirstRow) {
								newAttrs.filter = oldCell.attrs.filter;
								newAttrs.sort = oldCell.attrs.sort;

								tr.setNodeMarkup(oldCellPos, null, {
									...oldCell.attrs,
									filter: null,
									sort: null,
								});
							}

							tr.setNodeMarkup(newCellPos, null, newAttrs);
							newCellPos += cell.nodeSize;
						});
					}
				});
				return result;
			},
			addColumnBefore: () => (props) => {
				const result = this.parent().addColumnBefore()(props);
				updateSortingOrderOnAddCol(props.tr);
				return result;
			},
			addColumnAfter: () => (props) => {
				const result = this.parent().addColumnAfter()(props);
				updateSortingOrderOnAddCol(props.tr);
				return result;
			},
		};
	},

	addKeyboardShortcuts() {
		return {
			...this.parent(),
			Tab: () => {
				if (this.editor.isActive("listItem")) return false;
				return this.parent().Tab.call(this);
			},
			"Shift-Tab": () => {
				if (this.editor.isActive("listItem")) return false;
				return this.parent()["Shift-Tab"].call(this);
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
			...this.parent().filter((plagin) => (plagin as Plugin & { key: string }).key !== "tableColumnResizing$"),
		];
	},
}).configure({
	resizable: true,
	cellMinWidth: COL_MIN_WIDTH,
});

export default CustomTable;
