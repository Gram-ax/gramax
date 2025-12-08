import { classNames } from "@components/libs/classNames";
import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import styled from "@emotion/styled";
import PlusActions from "@ext/markdown/elements/table/edit/components/Helpers/PlusActions";
import PlusMenu from "@ext/markdown/elements/table/edit/components/Helpers/PlusMenu";
import {
	addColumn,
	addColumnRight,
	addRow,
	addRowDown,
	getFirstTdPosition,
	getRowPosition,
} from "@ext/markdown/elements/table/edit/logic/utils";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { columnResizingPluginKey } from "prosemirror-tables";
import { RefObject, useCallback, useEffect, useState } from "react";
import {
	CONTROLS_CONTAINER_VERTICAL_TOP,
	HELPERS_TOP,
} from "@ext/markdown/elements/table/edit/components/Helpers/consts";

interface TablePlusActionsProps {
	node: Node;
	editor: Editor;
	getPos: () => number;
	isHovered: boolean;
	tableRef: RefObject<HTMLTableElement>;
	tableSizes: {
		cols: string[];
		rows: string[];
	};
	className?: string;
	tableSheet?: TableNodeSheet;
}

const TablePlusActions = (props: TablePlusActionsProps) => {
	const { node, getPos, className, tableSizes, tableRef, isHovered, editor, tableSheet } = props;
	const [isVisible, setIsVisible] = useState(true);

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
			if (index === node.childCount) {
				const rowPos = getRowPosition(node, node.childCount, getPos()) + 1;
				if (!rowPos) return;
				return addRowDown(editor, rowPos);
			}

			const rowPos = getRowPosition(node, index + 1, getPos()) + 1;
			if (!rowPos) return;
			addRow(editor, rowPos);
		},
		[editor, node, getPos],
	);

	const plusColumn = useCallback(
		(index?: number) => {
			if (index === -1) {
				const tdPos = getFirstTdPosition(node, 0, getPos());
				if (!tdPos) return;
				return addColumn(editor, tdPos);
			}

			const position = getFirstTdPosition(node, index + 1, getPos());
			if (!position) return;
			addColumnRight(editor, position);
		},
		[editor, node, getPos],
	);

	return (
		<div
			className={classNames(className, { hidden: !isVisible || !isHovered }, ["table-actions"])}
			contentEditable={false}
		>
			<div className="table-controller">
				<div className="controls-container-horizontal">
					<div data-col-number={-1} className="plus-actions-container">
						<PlusActions
							index={-1}
							onClick={plusColumn}
							dataQa={`qa-add-column-right`}
							tableRef={tableRef}
						/>
					</div>
					{tableSizes?.cols?.map((_, index) => (
						<div key={index} data-col-number={index} className="plus-actions-container">
							<PlusMenu
								getPos={getPos}
								node={node}
								isHovered={isHovered}
								index={index}
								editor={editor}
								tableSheet={tableSheet}
							/>
							<PlusActions
								index={index}
								onClick={plusColumn}
								dataQa={`qa-add-column-${index}`}
								tableRef={tableRef}
							/>
						</div>
					))}
				</div>

				<div className="controls-container-vertical">
					{tableSizes?.rows?.map((_, index) => (
						<div key={index} data-row-number={index} className="plus-actions-container">
							<PlusActions
								index={index}
								vertical
								onClick={plusRow}
								dataQa={`qa-add-row-${index}`}
								tableRef={tableRef}
							/>
							<PlusMenu
								getPos={getPos}
								node={node}
								vertical
								isHovered={isHovered}
								index={index}
								editor={editor}
								tableSheet={tableSheet}
							/>
						</div>
					))}
					<div data-row-number={tableSizes?.rows?.length} className="plus-actions-container">
						<PlusActions
							index={tableSizes?.rows?.length}
							vertical
							onClick={plusRow}
							dataQa={`qa-add-row-down`}
							tableRef={tableRef}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default styled(TablePlusActions)`
	position: absolute;
	top: 0;
	&:has(*[aria-expanded="true"]) {
		display: flex;
		visibility: visible !important;
		pointer-events: auto !important;
		overflow: visible !important;
	}

	.table-controller {
		position: relative;
	}

	.controls-container-horizontal {
		position: absolute;
		left: 1.5em;
		top: ${HELPERS_TOP};
		overflow-x: visible;
		display: grid;
		justify-content: center;
		grid-template-columns: ${({ tableSizes }) => `0px ${tableSizes?.cols?.join(" ")}`};

		.plus-actions-container {
			height: 12px;
			pointer-events: none;
			> * {
				pointer-events: auto;
			}
		}
	}

	.controls-container-vertical {
		position: absolute;
		top: ${CONTROLS_CONTAINER_VERTICAL_TOP};
		left: 0;
		overflow-y: visible;
		display: grid;
		justify-content: center;
		grid-template-rows: ${({ tableSizes }) => `${tableSizes?.rows?.join(" ")} 0px`};

		.plus-actions-container {
			width: 12px;
		}
	}

	&.hidden,
	.hidden {
		visibility: hidden;
		pointer-events: none;
		overflow: hidden;
	}

	.plus-actions-container {
		position: relative;
	}

	.table-controller {
		position: relative;
	}
`;
