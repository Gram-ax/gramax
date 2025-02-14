import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import PlusActions from "@ext/markdown/elements/table/edit/components/Helpers/PlusActions";
import PlusMenu from "@ext/markdown/elements/table/edit/components/Helpers/PlusMenu";
import {
	addColumn,
	addColumnRight,
	addRow,
	addRowDecoration,
	addRowDown,
	addTdDecoration,
	getFirstTdPosition,
	getRowPosition,
} from "@ext/markdown/elements/table/edit/logic/utils";
import { HoverEnumTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import EditorService from "@ext/markdown/elementsUtils/ContextServices/EditorService";
import { Node } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { columnResizingPluginKey } from "prosemirror-tables";
import { MouseEvent, RefObject, useCallback, useEffect, useState } from "react";

interface TablePlusActionsProps {
	node: Node;
	getPos: () => number;
	isHovered: boolean;
	tableRef: RefObject<HTMLTableElement>;
	tableSizes: {
		cols: string[];
		rows: string[];
	};
	className?: string;
}

const TablePlusActions = (props: TablePlusActionsProps) => {
	const { node, getPos, className, tableSizes, tableRef, isHovered } = props;
	const [isVisible, setIsVisible] = useState(true);
	const editor = EditorService.getEditor();

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

	const onMouseEnter = useCallback(
		(e: MouseEvent, index: number, type: HoverEnumTypes, vertical?: boolean) => {
			if (type === HoverEnumTypes.DELETE) {
				if (vertical)
					addRowDecoration(node, getPos(), index, editor, {
						class: "delete",
					});
				else
					addTdDecoration(node, getPos(), index, editor, {
						class: "delete",
					});
			}
		},
		[node, editor, getPos, tableSizes],
	);

	const onMouseLeave = useCallback(() => {
		editor.view.dispatch(editor.view.state.tr.setMeta("removeDecoration", true));
	}, [editor]);

	const plusRow = useCallback(
		(index?: number) => {
			if (index === node.childCount) {
				const rowPos = getRowPosition(node, node.childCount, getPos());
				if (!rowPos) return;
				return addRowDown(editor, rowPos);
			}

			const position = getRowPosition(node, index + 1, getPos());
			if (!position) return;
			addRow(editor, position);
		},
		[editor, node, getPos],
	);

	const plusColumn = useCallback(
		(index?: number) => {
			if (index === node.content.firstChild?.childCount) {
				const tdPos = getFirstTdPosition(node, node.firstChild.childCount, getPos());
				if (!tdPos) return;
				return addColumnRight(editor, tdPos);
			}

			const position = getFirstTdPosition(node, index + 1, getPos());
			if (!position) return;
			addColumn(editor, position);
		},
		[editor, node, getPos],
	);

	return (
		<div
			className={classNames(className, { hidden: !isVisible || !isHovered }, ["table-actions"])}
			contentEditable={false}
		>
			<div className="controls-container-horizontal">
				{tableSizes?.cols?.map((_, index) => (
					<div key={index} data-col-number={index} className="plus-actions-container">
						<PlusActions
							index={index}
							onClick={plusColumn}
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							dataQa={`qa-add-column-${index}`}
							tableRef={tableRef}
						/>
						<PlusMenu
							getPos={getPos}
							node={node}
							isHovered={isHovered}
							index={index}
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
						/>
					</div>
				))}
				<div data-col-number={tableSizes?.cols?.length} className="plus-actions-container">
					<PlusActions
						index={tableSizes?.cols?.length}
						onClick={plusColumn}
						onMouseEnter={onMouseEnter}
						onMouseLeave={onMouseLeave}
						dataQa={`qa-add-column-${tableSizes?.cols?.length}`}
						tableRef={tableRef}
					/>
				</div>
			</div>

			<div className="controls-container-vertical">
				{tableSizes?.rows?.map((_, index) => (
					<div key={index} data-row-number={index} className="plus-actions-container">
						<PlusActions
							index={index}
							vertical
							onClick={plusRow}
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
							dataQa={`qa-add-row-${index}`}
							tableRef={tableRef}
						/>
						<PlusMenu
							getPos={getPos}
							node={node}
							vertical
							isHovered={isHovered}
							index={index}
							onMouseEnter={onMouseEnter}
							onMouseLeave={onMouseLeave}
						/>
					</div>
				))}
				<div data-row-number={tableSizes?.rows?.length} className="plus-actions-container">
					<PlusActions
						index={tableSizes?.rows?.length}
						vertical
						onClick={plusRow}
						onMouseEnter={onMouseEnter}
						onMouseLeave={onMouseLeave}
						dataQa={`qa-add-row-${tableSizes?.rows?.length}`}
						tableRef={tableRef}
					/>
				</div>
			</div>
		</div>
	);
};

export default styled(TablePlusActions)`
	position: relative;
	top: 0;

	.controls-container-horizontal {
		position: absolute;
		margin-left: 1.5em;
		overflow-x: visible;
		display: grid;
		justify-content: center;
		z-index: var(--z-index-popover);
		grid-template-columns: ${({ tableSizes }) => `${tableSizes?.cols?.join(" ")} 0px`};

		.plus-actions-container {
			height: 12px;
		}
	}

	.controls-container-vertical {
		position: absolute;
		margin-top: 1em;
		overflow-y: visible;
		display: grid;
		justify-content: center;
		z-index: var(--z-index-popover);
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
