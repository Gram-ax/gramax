import { classNames } from "@components/libs/classNames";
import useWatch from "@core-ui/hooks/useWatch";
import {
	CONTROLS_CONTAINER_VERTICAL_TOP,
	HELPERS_TOP,
} from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import PlusActions from "@ext/markdown/elements/table/edit/components/Helpers/PlusActions";
import PlusMenu from "@ext/markdown/elements/table/edit/components/Helpers/PlusMenu";
import type { TableDataString } from "@ext/markdown/elements/table/edit/components/Helpers/useTableSizes";
import type TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import {
	addColumn,
	addColumnRight,
	addRow,
	addRowDown,
	getFirstTdPosition,
	getRowPosition,
} from "@ext/markdown/elements/table/edit/logic/utils";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { columnResizingPluginKey } from "prosemirror-tables";
import { type CSSProperties, type RefObject, useCallback, useEffect, useState } from "react";

interface TablePlusActionsProps {
	node: Node;
	editor: Editor;
	pos: number;
	isHovered: boolean;
	tableRef: RefObject<HTMLTableElement>;
	tableSizes: TableDataString;
	className?: string;
	tableSheet?: TableNodeSheet;
	sorted?: boolean;
	hideControls: () => void;
}

interface TableRowActionsProps {
	dataQa: string;
	editor: Editor;
	index: number;
	node: Node;
	onClick: (index?: number) => void;
	pos: number;
	tableRef: RefObject<HTMLTableElement>;
	tableSheet?: TableNodeSheet;
	withMenu?: boolean;
}

const TableRowActions = (props: TableRowActionsProps) => {
	const { dataQa, editor, index, node, onClick, pos, tableRef, tableSheet, withMenu = true } = props;

	return (
		<div className="plus-actions-container relative w-3" data-row-number={index}>
			<PlusActions dataQa={dataQa} index={index} onClick={onClick} tableRef={tableRef} vertical />
			{withMenu && (
				<PlusMenu editor={editor} index={index} node={node} pos={pos} tableSheet={tableSheet} vertical />
			)}
		</div>
	);
};

const TablePlusActions = (props: TablePlusActionsProps) => {
	const { node, pos, className, tableSizes, tableRef, isHovered, editor, tableSheet, sorted, hideControls } = props;
	const [isVisible, setIsVisible] = useState(true);

	const hidden = !isVisible || !isHovered;
	const cols = tableSizes?.cols || [];
	const rows = tableSizes?.rows || [];
	const rowIndexes = tableSizes?.rowIndexes || [];
	const style = {
		"--table-controls-helper-top": HELPERS_TOP,
		"--table-controls-vertical-top": CONTROLS_CONTAINER_VERTICAL_TOP,
		"--table-grid-template-columns": `0px ${cols.join(" ")}`,
		"--table-grid-template-rows": `${rows.join(" ")} 0px`,
	} as CSSProperties;

	useWatch(() => {
		if (hidden) hideControls();
	}, [hidden]);

	useEffect(() => {
		const onTransaction = ({ transaction }: { transaction: Transaction }) => {
			const meta = transaction.getMeta(columnResizingPluginKey);
			if (!meta) return;
			if (meta.activeHandle === -1 || meta.dragging || meta.setDragging) return setIsVisible(false);
			setIsVisible(true);
		};

		editor.on("transaction", onTransaction);

		return () => {
			editor.off("transaction", onTransaction);
		};
	}, [editor]);

	const plusRow = useCallback(
		(index?: number) => {
			if (index === node.childCount || (sorted && index !== 0)) {
				const rowPos = getRowPosition(node, node.childCount, pos) + 1;
				if (!rowPos) return;
				return addRowDown(editor, rowPos);
			}

			const rowPos = getRowPosition(node, index + 1, pos) + 1;
			if (!rowPos) return;
			addRow(editor, rowPos);
		},
		[editor, node, pos, sorted],
	);

	const plusColumn = useCallback(
		(index?: number) => {
			if (index === -1) {
				const tdPos = getFirstTdPosition(node, 0, pos);
				if (!tdPos) return;
				return addColumn(editor, tdPos);
			}

			const position = getFirstTdPosition(node, index + 1, pos);
			if (!position) return;
			addColumnRight(editor, position);
		},
		[editor, node, pos],
	);

	return (
		<div
			className={classNames(className, { hidden }, [
				"table-actions",
				"absolute top-0",
				`[&:has(*[aria-expanded="true"])]:flex`,
				`[&:has(*[aria-expanded="true"])]:!visible`,
				`[&:has(*[aria-expanded="true"])]:!overflow-visible`,
				`[&:has(*[aria-expanded="true"])]:!pointer-events-auto`,
				"[&.hidden]:invisible [&.hidden]:overflow-hidden [&.hidden]:pointer-events-none",
			])}
			contentEditable={false}
			style={style}
		>
			<div className="table-controller relative">
				<div className="controls-container-horizontal absolute left-[1.5em] top-[var(--table-controls-helper-top)] grid grid-cols-[var(--table-grid-template-columns)] justify-center overflow-x-visible">
					<div
						className="plus-actions-container relative h-3 pointer-events-none [&>*]:pointer-events-auto"
						data-col-number={-1}
					>
						<PlusActions dataQa="qa-add-column-right" index={-1} onClick={plusColumn} tableRef={tableRef} />
					</div>
					{cols.map((_, index) => (
						<div
							className="plus-actions-container relative h-3 pointer-events-none [&>*]:pointer-events-auto"
							data-col-number={index}
							// biome-ignore lint/suspicious/noArrayIndexKey: column controls follow table column order
							key={index}
						>
							<PlusMenu
								dataQa={`qa-column-menu-${index}`}
								editor={editor}
								index={index}
								node={node}
								pos={pos}
								tableSheet={tableSheet}
							/>
							<PlusActions
								dataQa={`qa-add-column-${index}`}
								index={index}
								onClick={plusColumn}
								tableRef={tableRef}
							/>
						</div>
					))}
				</div>

				<div className="controls-container-vertical absolute left-0 top-[var(--table-controls-vertical-top)] grid grid-rows-[var(--table-grid-template-rows)] justify-center overflow-y-visible">
					{rows.map((_, index) => {
						const rowIndex = rowIndexes[index];

						if (rowIndex === null) {
							// biome-ignore lint/suspicious/noArrayIndexKey: row controls follow table row order
							return <div className="plus-actions-container relative w-3" key={index} />;
						}

						return (
							<TableRowActions
								dataQa={`qa-add-row-${rowIndex}`}
								editor={editor}
								index={rowIndex}
								// biome-ignore lint/suspicious/noArrayIndexKey: row controls follow table row order
								key={index}
								node={node}
								onClick={plusRow}
								pos={pos}
								tableRef={tableRef}
								tableSheet={tableSheet}
							/>
						);
					})}
					<TableRowActions
						dataQa="qa-add-row-down"
						editor={editor}
						index={node.childCount}
						node={node}
						onClick={plusRow}
						pos={pos}
						tableRef={tableRef}
						withMenu={false}
					/>
				</div>
			</div>
		</div>
	);
};

export default TablePlusActions;
