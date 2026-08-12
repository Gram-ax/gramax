import Tooltip from "@components/Atoms/Tooltip";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import t from "@ext/localization/locale/translate";
import { HELPERS_LEFT, HELPERS_TOP } from "@ext/markdown/elements/table/edit/components/Helpers/consts";
import TablePlusActions from "@ext/markdown/elements/table/edit/components/Helpers/TablePlusActions";
import useTableSizes from "@ext/markdown/elements/table/edit/components/Helpers/useTableSizes";
import type TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import { getHoveredData } from "@ext/markdown/elements/table/edit/logic/utils";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import {
	type CSSProperties,
	type MouseEvent as ReactMouseEvent,
	type ReactNode,
	type RefObject,
	useCallback,
	useEffect,
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
	StickyTableWrapperComponent?: ({ children }: { children: JSX.Element }) => JSX.Element;
	sorted: boolean;
	tableSheet?: TableNodeSheet;
}

export type TableDataString = {
	cols: string[];
	rows: string[];
};

const HOVERED_CONTROL_CLASS_TO_REMOVE = "!hidden";

const getVisibleControlSelectors = (cellIndex: number, rowIndex: number) => [
	`[data-col-number="${cellIndex}"] [data-table-plus-menu="column"]`,
	`[data-col-number="${cellIndex}"] [data-table-plus-action="column"]`,
	`[data-col-number="${cellIndex - 1}"] [data-table-plus-action="column"]`,
	`[data-row-number="${rowIndex}"] [data-table-plus-menu="row"]`,
	`[data-row-number="${rowIndex}"] [data-table-plus-action="row"]`,
	`[data-row-number="${rowIndex + 1}"] [data-table-plus-action="row"]`,
];

const getVisibleControls = (container: HTMLElement, cellIndex: number, rowIndex: number) => {
	const controls = getVisibleControlSelectors(cellIndex, rowIndex).flatMap((selector) =>
		Array.from(container.querySelectorAll<HTMLElement>(selector)),
	);

	return Array.from(new Set(controls));
};

const TableHelper = (props: TableHelperProps) => {
	const { tableRef, hoverElementRef, children, node, pos, editor, sorted, StickyTableWrapperComponent, tableSheet } =
		props;

	const [isHovered, setIsHovered] = useState(false);

	const rafId = useRef<number>(null);
	const lastEvent = useRef<ReactMouseEvent | null>(null);
	const hoverControlsRef = useRef<HTMLDivElement>(null);
	const visibleControlsRef = useRef<HTMLElement[]>([]);
	const hoveredData = useRef({ cellIndex: -1, rowIndex: -1 });

	const setHoveredData = useCallback((cellIndex: number, rowIndex: number) => {
		if (hoveredData.current.cellIndex === cellIndex && hoveredData.current.rowIndex === rowIndex) return;

		hoveredData.current = { cellIndex, rowIndex };

		const hoverControls = hoverControlsRef.current;
		if (!hoverControls) return;

		visibleControlsRef.current.forEach((control) => control.classList.add(HOVERED_CONTROL_CLASS_TO_REMOVE));
		visibleControlsRef.current = [];

		if (cellIndex === -1 || rowIndex === -1) {
			return;
		}

		const nextVisibleControls = getVisibleControls(hoverControls, cellIndex, rowIndex);
		nextVisibleControls.forEach((control) => control.classList.remove(HOVERED_CONTROL_CLASS_TO_REMOVE));
		visibleControlsRef.current = nextVisibleControls;
	}, []);

	const hideControls = useCallback(() => {
		setHoveredData(-1, -1);
	}, [setHoveredData]);
	const { tableSizes } = useTableSizes(tableRef, hideControls);

	const onMouseMove = useCallback(
		(event: ReactMouseEvent) => {
			lastEvent.current = event;
			if (rafId.current !== null) return;

			rafId.current = requestAnimationFrame(() => {
				rafId.current = null;
				const e = lastEvent.current;
				if (!e) return;

				const { cellIndex, rowIndex } = getHoveredData(e, tableRef.current);
				if (cellIndex === -1 || rowIndex === -1) return;

				setHoveredData(cellIndex, rowIndex);
			});
		},
		[tableRef.current, setHoveredData],
	);

	useEffect(
		() => () => {
			if (rafId.current !== null) cancelAnimationFrame(rafId.current);
			rafId.current = null;
			lastEvent.current = null;
			hideControls();
		},
		[hideControls],
	);

	const selectNode = useCallback(() => {
		editor.commands.setNodeSelection(pos);
	}, [pos, editor]);
	const selectAllStyle = {
		"--table-helpers-top": HELPERS_TOP,
		"--table-helpers-left": HELPERS_LEFT,
	} as CSSProperties;

	const WrapperChildren = (
		<>
			{children}
			{isHovered && (
				<div
					className="pointer-events-none absolute left-[var(--table-helpers-left)] top-[var(--table-helpers-top)] z-[1]"
					data-table-select-all-container
					style={selectAllStyle}
				>
					<Tooltip content={t("select-table")} delay={[1000, 0]}>
						<div
							className="relative z-[var(--z-index-base)] cursor-pointer border-b-4 border-l-4 border-r-4 border-t-4 border-b-[var(--color-line)] border-l-transparent border-r-[var(--color-line)] border-t-transparent pointer-events-auto after:absolute after:right-0 after:top-0 after:h-0 after:w-0 after:border-l-4 after:border-l-transparent after:content-[''] hover:border-b-[var(--color-article-text)] hover:border-r-[var(--color-article-text)]"
							contentEditable={false}
							data-qa="table-select-all"
							data-testid="table-select-all"
							onClick={selectNode}
						/>
					</Tooltip>
				</div>
			)}
			<TablePlusActions
				editor={editor}
				hideControls={hideControls}
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
			<div onMouseMove={onMouseMove} ref={hoverControlsRef}>
				<StickyTableWrapperComponent>{WrapperChildren}</StickyTableWrapperComponent>
			</div>
		</HoverableActions>
	);
};

export default TableHelper;
