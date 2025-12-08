import Tooltip from "@components/Atoms/Tooltip";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import TablePlusActions from "@ext/markdown/elements/table/edit/components/Helpers/TablePlusActions";
import { hideOldControls, showNewControls } from "@ext/markdown/elements/table/edit/logic/controlActions";
import { getHoveredData, getTableSizes } from "@ext/markdown/elements/table/edit/logic/utils";
import { HoveredData } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";
import {
	MouseEvent as ReactMouseEvent,
	ReactNode,
	RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
	useMemo,
} from "react";
import StickyTableWrapper from "@components/StickyWrapper/StickyTableWrapper";
import { HELPERS_LEFT, HELPERS_TOP } from "@ext/markdown/elements/table/edit/components/Helpers/consts";

interface TableHelperProps {
	tableRef: RefObject<HTMLTableElement>;
	hoverElementRef: RefObject<HTMLTableElement>;
	children: ReactNode;
	node: Node;
	getPos: () => number;
	editor: Editor;
	disabledWrapper?: boolean;
}

type TableDataString = {
	cols: string[];
	rows: string[];
};

const TriangleButtonContainer = styled.div`
	position: absolute;
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

const actionsOptions = {
	delete: false,
};

const TableHelper = (props: TableHelperProps) => {
	const { tableRef, hoverElementRef, children, node, getPos, editor, disabledWrapper } = props;

	const [tableSizes, setTableSizes] = useState<TableDataString>(null);
	const [isHovered, setIsHovered] = useState(false);

	const hoveredData = useRef<HoveredData>(null);

	const pos = getPos();
	const tableSheet = useMemo(() => TableNodeSheet.createFromProseMirrorNode(node, pos), [node, pos]);

	useEffect(() => {
		const tableObserver = new ResizeObserver(() => {
			const tableSizes = getTableSizes(tableRef.current);
			setTableSizes(tableSizes);
		});

		const observer = new MutationObserver((mutationsList) => {
			const filterNodes = (nodes: NodeList) => {
				return Array.from(nodes).filter((node: HTMLElement) => {
					return (
						!node?.classList?.contains("column-resize-handle") &&
						!node?.classList?.contains("add-row") &&
						!node?.classList?.contains("add-column")
					);
				});
			};

			for (const mutation of mutationsList) {
				const resizerAddHandlesCount = filterNodes(mutation.addedNodes).length;
				const resizerRemoveHandlesCount = filterNodes(mutation.removedNodes).length;
				const isChildListType = mutation.type === "childList";
				const isAddNodesNonZero = resizerAddHandlesCount !== 0;
				const isRemovedNodesNonZero = resizerRemoveHandlesCount !== 0;
				const isAddNodes = resizerAddHandlesCount === mutation.addedNodes.length;
				const isRemovedNodes = resizerRemoveHandlesCount === mutation.removedNodes.length;

				if (isChildListType && isAddNodesNonZero && isAddNodes) {
					const tableSizes = getTableSizes(tableRef.current);
					setTableSizes(tableSizes);
					return hideControls();
				}

				if (isChildListType && isRemovedNodesNonZero && isRemovedNodes) {
					const tableSizes = getTableSizes(tableRef.current);
					setTableSizes(tableSizes);
					return hideControls();
				}
			}
		});

		tableObserver.observe(tableRef.current.lastElementChild);
		observer.observe(tableRef.current.lastElementChild, { childList: true, subtree: true });

		return () => {
			tableObserver.disconnect();
			observer.disconnect();
		};
	}, [tableRef.current]);

	const commonParent = tableRef.current?.parentElement.parentElement;

	const hideControls = useCallback(() => {
		const containerHorizontal = commonParent?.querySelector(".controls-container-horizontal");
		const containerVertical = commonParent?.querySelector(".controls-container-vertical");

		if (hoveredData.current) hideOldControls(containerVertical, containerHorizontal, { ...hoveredData.current });
		hoveredData.current = null;
	}, [tableRef.current, hoveredData, disabledWrapper]);

	const onMouseMove = useCallback(
		(event: ReactMouseEvent) => {
			const { cellIndex, rowIndex } = getHoveredData(event, commonParent);
			if (cellIndex === -1 || rowIndex === -1) return;

			if (hoveredData.current?.cellIndex === cellIndex && hoveredData.current?.rowIndex === rowIndex) return;

			const containerHorizontal = commonParent?.querySelector(".controls-container-horizontal");
			const containerVertical = commonParent?.querySelector(".controls-container-vertical");

			hideControls();
			showNewControls(containerVertical, containerHorizontal, Math.min(rowIndex, node.childCount - 1), cellIndex);

			hoveredData.current = { rowIndex, cellIndex };
		},
		[tableRef.current, hoveredData.current, node.firstChild.childCount, node.childCount, disabledWrapper],
	);

	const selectNode = useCallback(() => {
		const startPos = getPos();
		editor.commands.setNodeSelection(startPos);
	}, [getPos, editor]);

	const WrapperChildren = (
		<>
			{children}
			{
				<Tooltip content={t("select-table")} delay={[1000, 0]}>
					<TriangleButtonContainer data-table-select-all-container>
						<TriangleButton onClick={selectNode} data-qa="table-select-all" contentEditable={false} />
					</TriangleButtonContainer>
				</Tooltip>
			}
			<TablePlusActions
				isHovered={isHovered}
				tableSizes={tableSizes}
				node={node}
				getPos={getPos}
				tableRef={tableRef}
				editor={editor}
				tableSheet={tableSheet}
			/>
		</>
	);

	return (
		<HoverableActions
			hoverElementRef={hoverElementRef}
			setIsHovered={setIsHovered}
			isHovered={isHovered}
			actionsOptions={actionsOptions}
		>
			<div onMouseMove={onMouseMove}>
				<StickyTableWrapper tableRef={tableRef} disableWrapper={disabledWrapper}>
					{WrapperChildren}
				</StickyTableWrapper>
			</div>
		</HoverableActions>
	);
};

export default TableHelper;
