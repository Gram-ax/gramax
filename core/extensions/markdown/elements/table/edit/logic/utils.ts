import type TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import type { HoveredData } from "@ext/markdown/elements/table/edit/model/tableTypes";
import type { Editor } from "@tiptap/core";
import type { Attrs, Node } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import { Decoration } from "@tiptap/pm/view";
import type { MouseEvent } from "react";
import { TableHeaderTypes } from "../model/tableTypes";

const getCellContainer = (row: HTMLElement) => row?.querySelector("td")?.parentElement ?? null;

const isWidgetRow = (row: Element) => row.classList.contains("ProseMirror-widget");

const getDocumentRows = (tableBody: HTMLElement): HTMLTableRowElement[] =>
	Array.from(tableBody.children).filter((row): row is HTMLTableRowElement => !isWidgetRow(row));

export type TableSizes = {
	cols: string[];
	rows: string[];
	rowIndexes: (number | null)[];
};

const getStickyHeaderTopPadding = (table: HTMLElement) => {
	const stickyWrapper = table.closest<HTMLElement>("[data-sticky-wrapper]");
	if (stickyWrapper?.dataset.stickyRowActive !== "true") return 0;

	const topPadding = window.getComputedStyle(stickyWrapper).getPropertyValue("--sticky-top-padding");
	return parseFloat(topPadding) || 0;
};

export const workHeaderType = (
	currentHeader: TableHeaderTypes,
	type: TableHeaderTypes.ROW | TableHeaderTypes.COLUMN,
) => {
	const checked = currentHeader === type || currentHeader === TableHeaderTypes.BOTH;
	let newHeader: TableHeaderTypes;
	if (checked) {
		if (currentHeader === TableHeaderTypes.BOTH) {
			newHeader = type === TableHeaderTypes.ROW ? TableHeaderTypes.COLUMN : TableHeaderTypes.ROW;
		} else {
			newHeader = TableHeaderTypes.NONE;
		}
	} else {
		if (
			(currentHeader === TableHeaderTypes.COLUMN && type === TableHeaderTypes.ROW) ||
			(currentHeader === TableHeaderTypes.ROW && type === TableHeaderTypes.COLUMN)
		) {
			newHeader = TableHeaderTypes.BOTH;
		} else {
			newHeader = type;
		}
	}
	return { checked, newHeader };
};

export const getTableColumnCellPositions = (node: Node, pos: number, index: number) => {
	const numRows = node.childCount;
	const positions = [];

	for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
		const cellPos = getTdPosition(node, index, pos, rowIndex);

		if (cellPos === null || cellPos === undefined) continue;
		positions.push(cellPos);
	}

	return positions;
};

export const addRowDecoration = (sheet: TableNodeSheet, rowIndex: number, tr: Transaction, attrs: Attrs) => {
	const positionMap = sheet.getPositionMap();
	if (!positionMap) return null;

	const decorations = [];

	const sheetData = sheet.getSheet();
	if (!sheetData?.[0]) return null;

	const logicalRow = sheet.getRow(rowIndex);
	if (logicalRow.length === 0) return null;

	logicalRow.forEach((cell) => {
		if (!cell) return;

		const cellNode = tr.doc.nodeAt(cell);
		if (cellNode) decorations.push(Decoration.node(cell, cell + cellNode.nodeSize, attrs));
	});

	if (decorations.length > 0) return tr.setMeta("addDecoration", decorations);

	return null;
};

export const addColumnDecoration = (sheet: TableNodeSheet, columnIndex: number, tr: Transaction, attrs: Attrs) => {
	const positionMap = sheet.getPositionMap();
	if (!positionMap) return null;

	const decorations = [];

	const sheetData = sheet.getSheet();
	if (!sheetData) return null;

	const logicalColumn = sheet.getColumn(sheet.getLogicalColumnIndex(columnIndex));
	if (logicalColumn.length === 0) return null;

	logicalColumn.forEach((cell) => {
		if (!cell) return;

		const cellNode = tr.doc.nodeAt(cell);
		if (cellNode) decorations.push(Decoration.node(cell, cell + cellNode.nodeSize, attrs));
	});

	if (decorations.length > 0) return tr.setMeta("addDecoration", decorations);

	return null;
};

export const getTableRowCellsPosition = (sheet: TableNodeSheet, rowIndex: number) => {
	const positionMap = sheet.getPositionMap();
	if (!positionMap) return [];

	const positions = [];

	const sheetData = sheet.getSheet();
	if (!sheetData?.[0]) return [];

	const maxColumns = sheetData[0].length;

	for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
		const cellInfo = positionMap.getCellInfo(rowIndex, columnIndex);
		if (cellInfo?.isMaster) {
			positions.push({
				position: cellInfo.position,
				rowIndex,
				columnIndex,
				colspan: cellInfo.colspan,
				rowspan: cellInfo.rowspan,
				isMerged: cellInfo.isMerged,
				isMaster: cellInfo.isMaster,
			});
		}
	}

	return positions;
};

export const getTableColumnCellsPositions = (sheet: TableNodeSheet, columnIndex: number) => {
	const positionMap = sheet.getPositionMap();
	if (!positionMap) return [];

	const positions = [];

	const sheetData = sheet.getSheet();
	if (!sheetData) return [];

	const maxRows = sheetData.length;

	for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
		const cellInfo = positionMap.getCellInfo(rowIndex, columnIndex);
		if (cellInfo?.isMaster) {
			positions.push({
				position: cellInfo.position,
				rowIndex,
				columnIndex,
				colspan: cellInfo.colspan,
				rowspan: cellInfo.rowspan,
				isMerged: cellInfo.isMerged,
				isMaster: cellInfo.isMaster,
			});
		}
	}

	return positions;
};

export const getFirstTdPosition = (node: Node, index: number, startPos: number) => {
	const firstTd = node.content.firstChild;
	let pos = startPos + 2;
	if (!firstTd) return;

	for (let i = 0; i < index; i++) {
		pos += index - 1 === i ? 1 : node.content.firstChild?.maybeChild(i)?.nodeSize;
	}

	return pos;
};

export const getTdPosition = (
	tableNode: Node,
	columnIndex: number,
	tableStartPos: number,
	rowIndex: number,
): number => {
	if (!tableNode) return;
	if (rowIndex > tableNode.childCount) return;

	const rowNode = tableNode.maybeChild(rowIndex);
	if (!rowNode || columnIndex > rowNode.childCount) return;

	let rowStartPos = tableStartPos + 1;
	for (let i = 0; i < rowIndex; i++) {
		rowStartPos += tableNode.maybeChild(i)?.nodeSize;
	}

	let cellStartPos = rowStartPos + 1;
	for (let i = 0; i < columnIndex; i++) {
		cellStartPos += rowNode.maybeChild(i)?.nodeSize;
	}

	return cellStartPos;
};

export const getRowPosition = (node: Node, index: number, startPos: number) => {
	let pos = startPos + 2;
	for (let i = 0; i < index; i++) {
		pos += index - 1 === i ? 1 : node.content?.maybeChild(i)?.nodeSize;
	}

	return pos;
};

export const addRowDown = (editor: Editor, cellPosition: number) => {
	editor.chain().focus(cellPosition).addRowAfter().setMeta("removeDecoration", true).run();
};

export const addColumnRight = (editor: Editor, cellPosition: number) => {
	editor.chain().focus(cellPosition).addColumnAfter().setMeta("removeDecoration", true).run();
};

export const addRow = (editor: Editor, cellPosition?: number) => {
	editor.chain().focus(cellPosition).addRowBefore().setMeta("removeDecoration", true).run();
};

export const addColumn = (editor: Editor, cellPosition?: number) => {
	editor.chain().focus(cellPosition).addColumnBefore().setMeta("removeDecoration", true).run();
};

type HoveredMouseEvent = Pick<MouseEvent, "clientX" | "clientY" | "target">;

const findCellByPosition = (event: HoveredMouseEvent, table?: HTMLTableElement): HTMLTableCellElement | undefined => {
	if (!(table instanceof HTMLElement)) return;

	const rect = table.getBoundingClientRect();
	const x = Math.min(Math.max(event.clientX, rect.left + 1), event.clientX + 50);
	const y = Math.min(Math.max(event.clientY, rect.top + 1), event.clientY + 20);

	const el = document.elementFromPoint(x, y) as HTMLElement | null;
	return (el?.closest("td, th") as HTMLTableCellElement) ?? undefined;
};

const getRowIndex = (clientY: number, rows: HTMLElement[], cell: HTMLElement): number => {
	let lo = 0;
	let hi = rows.length - 1;

	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const { top, bottom } = rows[mid].getBoundingClientRect();

		if (clientY < top) hi = mid - 1;
		else if (clientY > bottom) lo = mid + 1;
		else return mid;
	}

	const row = cell.closest("tr") as HTMLElement | null;
	return row ? rows.indexOf(row) : -1;
};

export const getHoveredData = (event: HoveredMouseEvent, table?: HTMLTableElement): HoveredData => {
	const target = event.target as HTMLElement;
	let cell = target.closest("td, th") as HTMLTableCellElement | null;

	if (!cell) cell = findCellByPosition(event, table) ?? null;
	if (!cell) return { rowIndex: -1, cellIndex: -1 };

	const tr = cell.closest("tr") as HTMLTableRowElement | null;
	if (!tr?.parentElement) return { rowIndex: -1, cellIndex: -1 };

	const rows = getDocumentRows(tr.parentElement) as HTMLElement[];
	const cellContainers = rows.map(getCellContainer);
	const rowIndex = cell.rowSpan > 1 ? getRowIndex(event.clientY, rows, cell) : rows.indexOf(tr);

	if (rowIndex < 0 || !cellContainers[rowIndex]) return { rowIndex: -1, cellIndex: -1 };

	const targetContainer = cellContainers[rowIndex];
	const cellIndex = Math.max(
		Math.min(Array.from(targetContainer.children).indexOf(cell), targetContainer.childElementCount - 1),
		0,
	);

	let offset = 0;
	if (
		cellContainers[0]?.childElementCount === 1 &&
		cellContainers[0].firstElementChild?.getAttribute("rowSpan") !== "1"
	)
		offset = 1;

	return { rowIndex, cellIndex: Math.min(cellIndex, (cellContainers[0]?.childElementCount ?? 0) - offset) };
};

export const getTableSizes = (table: HTMLTableElement): TableSizes => {
	const cols = [];
	const rows = [];
	const rowIndexes = [];
	const tableBody = table?.tBodies[0];
	if (!tableBody) return { cols: [], rows: [], rowIndexes: [] };

	const firstRow = getCellContainer(getDocumentRows(tableBody)[0]);
	if (!firstRow) return { cols: [], rows: [], rowIndexes: [] };

	const hasAggregatedRow = (tableBody.lastElementChild as HTMLTableRowElement).dataset.aggregation === "true";
	const allRows = Array.from(tableBody.children) as HTMLTableRowElement[];
	const arrayRows = hasAggregatedRow ? allRows.slice(0, -1) : allRows;
	const arrayCols = firstRow?.children ? Array.from(firstRow.children) : [];
	const stickyHeaderTopPadding = getStickyHeaderTopPadding(table);

	arrayCols.forEach((child: HTMLTableColElement) => {
		cols.push(`${child.getBoundingClientRect().width}px`);
	});

	let documentRowIndex = 0;
	arrayRows
		.filter((row: HTMLTableRowElement) => row.childElementCount)
		.forEach((row: HTMLTableRowElement, index) => {
			const height = Math.max(0, row.getBoundingClientRect().height - (index === 0 ? stickyHeaderTopPadding : 0));
			rows.push(`${height}px`);
			rowIndexes.push(isWidgetRow(row) ? null : documentRowIndex++);
		});

	return { cols, rows, rowIndexes };
};
