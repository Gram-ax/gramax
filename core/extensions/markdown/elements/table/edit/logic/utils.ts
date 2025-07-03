import TableNodeSheet from "@ext/markdown/elements/table/edit/logic/TableNodeSheet";
import { HoveredData } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Editor } from "@tiptap/core";
import { Attrs, Node } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { Decoration } from "@tiptap/pm/view";
import { MouseEvent } from "react";

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
	if (!sheetData || !sheetData[0]) return null;

	const logicalRow = sheet.getRow(sheet.getLogicalRowIndex(rowIndex));
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
	if (!sheetData || !sheetData[0]) return [];

	const maxColumns = sheetData[0].length;

	for (let columnIndex = 0; columnIndex < maxColumns; columnIndex++) {
		const cellInfo = positionMap.getCellInfo(rowIndex, columnIndex);
		if (cellInfo && cellInfo.isMaster) {
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
		if (cellInfo && cellInfo.isMaster) {
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

const findCellByPosition = (event: MouseEvent, parent: HTMLElement): HTMLTableCellElement => {
	const { clientX, clientY } = event;
	const tableRect = parent.getBoundingClientRect();

	const isAbove = clientY < tableRect.top + 10;
	const isLeft = clientX < tableRect.left + 50;

	const rows = Array.from(parent.querySelectorAll("tr"));
	const targetY = isAbove ? tableRect.top : clientY;
	const targetX = isLeft ? tableRect.left : clientX;
	let cells = [];

	if (isAbove) cells = Array.from(rows[0].children);
	if (isLeft) cells = Array.from(rows.map((row) => row.firstElementChild));

	if (!cells.length) return;

	let closestCell: HTMLTableCellElement;
	let closestDistance = Infinity;

	cells.forEach((cell: HTMLTableCellElement) => {
		if (!cell) return;

		const cellRect = cell.getBoundingClientRect();

		const closestX = Math.max(cellRect.left, Math.min(targetX, cellRect.right));
		const closestY = Math.max(cellRect.top, Math.min(targetY, cellRect.bottom));

		const distance = Math.sqrt((closestX - targetX) ** 2 + (closestY - targetY) ** 2);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestCell = cell;
		}
	});

	if (closestCell) {
		return closestCell;
	}
};

const getRowIndex = (clientY: number, rows: HTMLElement[], cell: HTMLElement): number => {
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i];
		const rowRect = row.getBoundingClientRect();
		if (clientY >= rowRect.top && clientY <= rowRect.bottom) {
			return i;
		}
	}

	const row = cell.closest("tr");
	return rows.indexOf(row);
};

export const getHoveredData = (event: MouseEvent, parent: HTMLElement): HoveredData => {
	const target = event.target as HTMLElement;
	let cell: HTMLTableCellElement = target.closest("td, th");

	if (!cell) cell = findCellByPosition(event, parent);
	if (!cell) return { rowIndex: -1, cellIndex: -1 };

	const rows = Array.from(cell.closest("tr").parentElement.children) as HTMLElement[];
	const rowIndex =
		cell.rowSpan > 1 ? getRowIndex(event.clientY, rows, cell as HTMLElement) : rows.indexOf(cell.closest("tr"));
	const cellIndex = Math.max(
		Math.min(Array.from(rows[rowIndex].children).indexOf(cell), rows[rowIndex].childElementCount - 1),
		0,
	);

	let offset = 0;

	if (rows[0].childElementCount === 1 && rows[0].firstElementChild.getAttribute("rowSpan") !== "1") offset = 1;

	return { rowIndex, cellIndex: Math.min(cellIndex, rows[0].childElementCount - offset) };
};

export const getTableSizes = (table: HTMLElement): { cols: string[]; rows: string[] } => {
	const cols = [];
	const rows = [];
	const tableBody = table?.lastElementChild;
	const firstRow = tableBody?.firstElementChild;
	if (!firstRow || !tableBody) return { cols: [], rows: [] };

	const hasAggregatedRow = (tableBody.lastElementChild as HTMLTableRowElement).dataset.aggregation === "true";
	const arrayRows = tableBody?.children
		? Array.from(tableBody.children).slice(
				0,
				hasAggregatedRow ? tableBody.childElementCount - 1 : tableBody.childElementCount,
		  )
		: [];
	const arrayCols = firstRow?.children ? Array.from(firstRow.children) : [];

	arrayCols.forEach((child: HTMLTableColElement) => {
		cols.push(child.getBoundingClientRect().width + "px");
	});

	arrayRows
		.filter((row: HTMLTableRowElement) => row.childElementCount)
		.forEach((row: HTMLTableRowElement) => {
			const height = row.getBoundingClientRect().height;
			rows.push(height + "px");
		});

	return { cols, rows };
};
