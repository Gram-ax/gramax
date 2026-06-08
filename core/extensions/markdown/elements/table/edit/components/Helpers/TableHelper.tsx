import Tooltip from "@components/Atoms/Tooltip";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import StickyTableWrapper from "@components/StickyWrapper/StickyTableWrapper";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { HELPERS_LEFT, HELPERS_TOP } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import TablePlusActions from "@ext/markdown/elements/table/edit/components/Helpers/TablePlusActions";
import useTableSizes from "@ext/markdown/elements/table/edit/components/Helpers/useTableSizes";
import { hideOldControls, showNewControls } from "@ext/markdown/elements/table/edit/logic/controlActions";
import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import { getHoveredData } from "@ext/markdown/elements/table/edit/logic/utils";
import type { HoveredData } from "@ext/markdown/elements/table/edit/model/tableTypes";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import {
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	type RefObject,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";

interface TableHelperProps {
	tableRef: RefObject<HTMLTableElement>;
	hoverElementRef: RefObject<HTMLTableElement>;
	children: ReactNode;
	node: Node;
	pos: number;
	editor: Editor;
	disabledWrapper?: boolean;
	sorted: boolean;
}

export type TableDataString = {
	cols: string[];
	rows: string[];
};

const TriangleButtonContainer = styled.div`
	position: absolute;
	z-index: 1;
	top: ${HELPERS_TOP};
	left: ${HELPERS_LEFT};
`;

const TriangleButton = styled.div`
	position: relative;
	cursor: pointer;
	border-top: 4px solid transparent;
	border-left: 4px solid transparent;
	border-bottom: 4px solid var(--color-line);
	border-right: 4px solid var(--color-line);
	z-index: var(--z-index-base);

	&::after {
		content: "";
		position: absolute;
		top: 0;
		right: 0;
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
	}

	&:hover {
		border-bottom: 4px solid var(--color-article-text);
		border-right: 4px solid var(--color-article-text);
	}
`;

const TableHelper = (props: TableHelperProps) => {
	const { tableRef, hoverElementRef, children, node, pos, editor, disabledWrapper, sorted } = props;

	const [isHovered, setIsHovered] = useState(false);

	const hoveredData = useRef<HoveredData>(null);

	const tableSheet = useMemo(() => TableNodeSheet.createFromProseMirrorNode(node, pos), [node, pos]);

	const commonParent = tableRef.current?.parentElement?.parentElement;

	const hideControls = useCallback(() => {
		const containerHorizontal = commonParent?.querySelector(".controls-container-horizontal");
		const containerVertical = commonParent?.querySelector(".controls-container-vertical");

		if (hoveredData.current) hideOldControls(containerVertical, containerHorizontal, { ...hoveredData.current });
		hoveredData.current = null;
	}, [commonParent]);

	const { tableSizes } = useTableSizes(tableRef, hideControls);

	const onMouseMove = useCallback(
		(event: ReactMouseEvent) => {
			const { cellIndex, rowIndex } = getHoveredData(event, commonParent);
			if (cellIndex === -1 || rowIndex === -1) return;

			if (hoveredData.current?.cellIndex === cellIndex && hoveredData.current?.rowIndex === rowIndex) return;

			const containerHorizontal = commonParent?.querySelector(
				":scope > .table-actions .controls-container-horizontal",
			);
			const containerVertical = commonParent?.querySelector(
				":scope > .table-actions .controls-container-vertical",
			);

			hideControls();
			showNewControls(containerVertical, containerHorizontal, Math.min(rowIndex, node.childCount - 1), cellIndex);

			hoveredData.current = { rowIndex, cellIndex };
		},
		[commonParent, node.childCount, hideControls],
	);

	const selectNode = useCallback(() => {
		editor.commands.setNodeSelection(pos);
	}, [pos, editor]);

	const WrapperChildren = (
		<>
			{children}
			{isHovered && (
				<Tooltip content={t("select-table")} delay={[1000, 0]}>
					<TriangleButtonContainer data-table-select-all-container>
						<TriangleButton
							contentEditable={false}
							data-qa="table-select-all"
							data-testid="table-select-all"
							onClick={selectNode}
						/>
					</TriangleButtonContainer>
				</Tooltip>
			)}
			<TablePlusActions
				editor={editor}
				isHovered={isHovered}
				node={node}
				pos={pos}
				sorted={sorted}
				tableRef={tableRef}
				tableSheet={tableSheet}
				tableSizes={tableSizes}
			/>
		</>
	);

	return (
		<HoverableActions
			actionsOptions={{
				delete: false,
			}}
			hideOnClick={false}
			hoverElementRef={hoverElementRef}
			isHovered={isHovered}
			setIsHovered={setIsHovered}
		>
			<div onMouseMove={onMouseMove}>
				<StickyTableWrapper disableWrapper={disabledWrapper} tableRef={tableRef}>
					{WrapperChildren}
				</StickyTableWrapper>
			</div>
		</HoverableActions>
	);
};

export default TableHelper;
