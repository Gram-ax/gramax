import useStickyTableHeader from "@components/StickyWrapper/hooks/useStickyTableHeader";
import {
	type GridColumns,
	type GridColWidths,
	STICKY_TABLE_WRAPPER_CLASS_NAME,
	type TotalWidths,
} from "@components/StickyWrapper/hooks/useStickyTableStyles";
import WidthWrapper, { type WidthWrapperProps } from "@components/WidthWrapper/WidthWrapper";
import useWatch from "@core-ui/hooks/useWatch";
import { TableHeaderTypes } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { type MutableRefObject, useLayoutEffect, useMemo, useRef, useState } from "react";

const getEffectiveBackgroundColor = (element: HTMLElement | null): string => {
	let el = element;
	while (el) {
		const bg = window.getComputedStyle(el).backgroundColor;
		if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
			return bg;
		}
		el = el.parentElement;
	}
	return "rgba(0, 0, 0, 0)";
};

const hasRowspanInFirstRow = (table: HTMLTableElement | null): boolean => {
	if (!table) return false;
	const firstRow = table.tBodies[0]?.rows[0];
	if (!firstRow) return false;
	const cells = Array.from(firstRow.children) as HTMLTableCellElement[];
	return cells.some((cell) => Number(cell.getAttribute("rowspan")) > 1);
};

const hasColspanInFirstCol = (table: HTMLTableElement | null): boolean => {
	if (!table) return false;
	let firstColumnOccupiedUntil = -1;
	for (const [rowIndex, row] of Array.from(table.tBodies[0]?.rows ?? []).entries()) {
		if (rowIndex <= firstColumnOccupiedUntil) continue;

		const cell = row.cells[0];
		if (!cell) continue;
		if (cell.colSpan > 1) {
			return true;
		}
		firstColumnOccupiedUntil = Math.max(firstColumnOccupiedUntil, rowIndex + cell.rowSpan - 1);
	}
	return false;
};

const getTableCols = (table: HTMLTableElement | null): HTMLTableColElement[] => {
	if (!table) return [];
	const colgroup = Array.from(table.children).find((child) => child.tagName === "COLGROUP");
	if (!colgroup) return [];

	return Array.from(colgroup.children).filter((child): child is HTMLTableColElement => child.tagName === "COL");
};

const getTableBodyRows = (table: HTMLTableElement | null): HTMLTableRowElement[] => {
	return Array.from(table?.tBodies[0]?.rows ?? []);
};

const getTableMeasureCells = (table: HTMLTableElement | null): HTMLTableCellElement[] => {
	return Array.from(table?.tHead?.rows[0]?.cells ?? []);
};

const isTableInsideTable = (table: HTMLTableElement | null): boolean => {
	return !!table.closest("[data-sticky-wrapper]")?.parentElement?.closest("[data-sticky-wrapper]");
};

const StickyTableWrapperInternal = (
	props: WidthWrapperProps & { headerRowRef?: MutableRefObject<HTMLTableRowElement> },
) => {
	const { tableRef, headerRowRef } = props;
	const [, forceTableLayoutUpdate] = useState(0);
	const bgColor = useMemo(() => getEffectiveBackgroundColor(tableRef.current), [tableRef.current]);
	const stickyTableWrapperRef = useRef<HTMLDivElement>(null);
	const topShadowContainerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const table = tableRef.current;
		if (!table) return;

		let rafId: number | null = null;
		const scheduleUpdate = () => {
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				forceTableLayoutUpdate((version) => version + 1);
			});
		};

		scheduleUpdate();

		const mutationObserver = new MutationObserver(scheduleUpdate);
		mutationObserver.observe(table, {
			attributes: true,
			childList: true,
			subtree: true,
			attributeFilter: ["style", "colspan", "rowspan", "colwidth", "data-colwidth"],
		});

		const resizeObserver = new ResizeObserver(scheduleUpdate);
		resizeObserver.observe(table);

		return () => {
			mutationObserver.disconnect();
			resizeObserver.disconnect();
			if (rafId !== null) cancelAnimationFrame(rafId);
		};
	}, [tableRef]);

	const clientWidth = tableRef.current?.clientWidth;

	const hasRowspan = hasRowspanInFirstRow(tableRef?.current);
	const hasColspan = hasColspanInFirstCol(tableRef?.current);

	const cols = !hasRowspan || !hasColspan ? getTableCols(tableRef?.current) : [];
	const rows = getTableBodyRows(tableRef?.current);
	const colRow = getTableMeasureCells(tableRef?.current);
	const header = tableRef?.current?.dataset.header as TableHeaderTypes;
	const enableStickyRow =
		!hasRowspan && rows.length !== 1 && (header === TableHeaderTypes.ROW || header === TableHeaderTypes.BOTH);
	const enableStickyCol = !hasColspan && (header === TableHeaderTypes.BOTH || header === TableHeaderTypes.COLUMN);

	const colWidthsRef = useRef<Array<{ styleWidth: number; computedWidth: number }>>([]);
	const colWidths = useMemo(() => {
		const prevColWidths = colWidthsRef.current;
		const newCols = cols;
		if (!newCols.length) {
			if (prevColWidths.length) colWidthsRef.current = [];
			return colWidthsRef.current;
		}
		const newColWidths = [...colRow].map((c, i) => ({
			styleWidth: parseFloat(newCols[i].style.width) || 0,
			computedWidth: parseFloat(window.getComputedStyle(c).width),
		}));

		const sameLenght = newColWidths.length === prevColWidths.length;
		const checkIdentityWidths = () =>
			newColWidths.every(
				(col, i) =>
					col.styleWidth === prevColWidths[i]?.styleWidth &&
					col.computedWidth === prevColWidths[i]?.computedWidth,
			);

		if (sameLenght && checkIdentityWidths()) return prevColWidths;

		colWidthsRef.current = newColWidths;
		return newColWidths;
	}, [cols, colRow]);

	const firstRowCells = Array.from(rows[0]?.cells ?? []);
	const firstRowCellsWidthsRef = useRef<string[]>([]);
	const firstRowCellsWidths = (() => {
		const newWidths = firstRowCells.map((c) => window.getComputedStyle(c).width);
		const prevWidths = firstRowCellsWidthsRef.current;

		if (
			newWidths.length === prevWidths.length &&
			newWidths.every((width, i) => parseFloat(width) - parseFloat(prevWidths[i]) <= 0.5)
		) {
			return prevWidths;
		}

		firstRowCellsWidthsRef.current = newWidths;
		return newWidths;
	})();

	const gridColumnsRef = useRef<GridColumns>({});
	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const gridColumns = useMemo(() => {
		const gridColumns: string[] = [];
		const totalWidths: TotalWidths[] = [];
		const gridColWidths: GridColWidths[] = [];

		for (let i = 0, colIndex = 0; i < firstRowCells.length; i++) {
			const element = firstRowCells[i];
			const colSpan = element.colSpan;
			let size = 0;
			const totalWidth = { computedWidth: 0, styleWidth: 0 };
			for (let currentColIndex = colIndex; currentColIndex < colIndex + colSpan; currentColIndex++) {
				const currentColWidth = colWidths[currentColIndex];
				if (!currentColWidth) return gridColumnsRef.current;

				const { computedWidth, styleWidth } = currentColWidth;

				if (currentColIndex === colIndex + colSpan - 1 && (size !== -1 || !styleWidth)) {
					const width = parseFloat(firstRowCellsWidths[i]) - totalWidth.computedWidth;
					gridColWidths.push({
						width,
						colIndex: currentColIndex + 1,
					});
				}

				totalWidth.computedWidth += computedWidth;
				if (size === -1) continue;
				if (styleWidth) {
					totalWidth.styleWidth += styleWidth;
					size += computedWidth > styleWidth ? computedWidth : styleWidth;
					continue;
				}
				totalWidth.styleWidth = 0;
				size = -1;
			}
			colIndex += colSpan;
			gridColumns.push(size !== -1 ? `${size}px` : `max-content`);
			totalWidths.push(totalWidth);
		}
		gridColumnsRef.current = {
			totalWidths,
			gridTemplateColumns: gridColumns.join(" "),
			gridColWidths,
		};
		return gridColumnsRef.current;
	}, [colWidths, firstRowCellsWidths]);

	useStickyTableHeader({
		bgColor,
		clientWidth,
		enableStickyCol,
		enableStickyRow,
		firstColumnWidth: colWidths?.[0]?.computedWidth,
		gridColumns,
		headerRowRef,
		stickyTableWrapperRef,
		tableRef,
		topShadowContainerRef,
	});

	const children = (
		<>
			{props.children}
			<div className="top-shadow-container" ref={topShadowContainerRef}>
				<div className="top-shadow to-transparent bg-gradient-to-b from-shadow-scroll opacity-5" />
			</div>
			<div className="left-shadow-container">
				<div className="left-shadow to-transparent bg-gradient-to-r from-shadow-scroll opacity-5" />
			</div>
		</>
	);
	return (
		<div className={STICKY_TABLE_WRAPPER_CLASS_NAME} data-sticky-wrapper="" ref={stickyTableWrapperRef}>
			<WidthWrapper additional={<div className="top-block" />} shadowBoxLeftProps={{ force: true }} {...props}>
				{children}
			</WidthWrapper>
		</div>
	);
};

const StickyTableWrapper = (props: WidthWrapperProps & { headerRowRef?: MutableRefObject<HTMLTableRowElement> }) => {
	const isNestedTable = useRef<boolean>(undefined);

	useWatch(() => {
		if (!props.tableRef.current || typeof isNestedTable.current === "boolean") return;
		isNestedTable.current = isTableInsideTable(props.tableRef.current);
	}, [props.tableRef.current]);

	if (isNestedTable.current) {
		return (
			<div data-sticky-wrapper="">
				<WidthWrapper {...props} />
			</div>
		);
	}

	return <StickyTableWrapperInternal {...props} />;
};

export default StickyTableWrapper;
