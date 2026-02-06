import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import {
	CONTROLS_CONTAINER_VERTICAL_TOP,
	HELPERS_TOP,
} from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import PlusActions from "@ext/markdown/elements/table/edit/components/Helpers/PlusActions";
import PlusMenu from "@ext/markdown/elements/table/edit/components/Helpers/PlusMenu";
import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
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
					<div className="plus-actions-container" data-col-number={-1}>
						<PlusActions
							dataQa={`qa-add-column-right`}
							index={-1}
							onClick={plusColumn}
							tableRef={tableRef}
						/>
					</div>
					{tableSizes?.cols?.map((_, index) => (
						<div className="plus-actions-container" data-col-number={index} key={index}>
							<PlusMenu
								editor={editor}
								getPos={getPos}
								index={index}
								isHovered={isHovered}
								node={node}
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

				<div className="controls-container-vertical">
					{tableSizes?.rows?.map((_, index) => (
						<div className="plus-actions-container" data-row-number={index} key={index}>
							<PlusActions
								dataQa={`qa-add-row-${index}`}
								index={index}
								onClick={plusRow}
								tableRef={tableRef}
								vertical
							/>
							<PlusMenu
								editor={editor}
								getPos={getPos}
								index={index}
								isHovered={isHovered}
								node={node}
								tableSheet={tableSheet}
								vertical
							/>
						</div>
					))}
					<div className="plus-actions-container" data-row-number={tableSizes?.rows?.length}>
						<PlusActions
							dataQa={`qa-add-row-down`}
							index={tableSizes?.rows?.length}
							onClick={plusRow}
							tableRef={tableRef}
							vertical
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
