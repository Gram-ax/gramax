import { HoveredData } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Editor } from "@tiptap/core";
import { Attrs, Node } from "@tiptap/pm/model";
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

export const getTableRowCellPositions = (node: Node, pos: number, index: number) => {
	const numCells = node.maybeChild(index)?.childCount;
	const positions = [];

	for (let cellIndex = 0; cellIndex < numCells; cellIndex++) {
		const cellPos = getTdPosition(node, cellIndex, pos, index);

		if (cellPos === null || cellPos === undefined) continue;
		positions.push(cellPos);
	}

	return positions;
};

export const addRowWidgetDecoration = (node: Node, pos: number, index: number, editor: Editor, dom: HTMLElement) => {
	const position = getRowPosition(node, index + 1, pos) - 2;
	if (!position) return;

	const rowNode = editor.state.doc.nodeAt(position);
	const decorations = [];

	if (!rowNode) return;
	for (let cellIndex = 0; cellIndex < rowNode.childCount; cellIndex++) {
		const cellPos = getTdPosition(node, cellIndex, pos, index);

		if (cellPos === null || cellPos === undefined) continue;
		decorations.push(Decoration.widget(cellPos + 1, dom.cloneNode(true), { key: `${cellPos}` }));
	}

	if (decorations.length > 0) editor.view.dispatch(editor.view.state.tr.setMeta("addDecoration", decorations));
};

export const addColumnWidgetDecoration = (node: Node, pos: number, index: number, editor: Editor, dom: HTMLElement) => {
	const numRows = node.childCount;
	const decorations = [];

	for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
		const cellPos = getTdPosition(node, index, pos, rowIndex) + 1;

		if (cellPos === null || cellPos === undefined) continue;
		decorations.push(Decoration.widget(cellPos, dom.cloneNode(true), { key: `${cellPos}` }));
	}

	if (decorations.length > 0) editor.view.dispatch(editor.view.state.tr.setMeta("addDecoration", decorations));
};

export const addRowDecoration = (node: Node, pos: number, index: number, editor: Editor, attrs: Attrs) => {
	const position = getRowPosition(node, index + 1, pos) - 2;

	if (!position) return;
	const rowNode = editor.state.doc.nodeAt(position);

	if (!rowNode) return;
	const decoration = Decoration.node(position, position + rowNode.nodeSize, attrs);

	editor.view.dispatch(editor.view.state.tr.setMeta("addDecoration", decoration));
};

export const addTdDecoration = (node: Node, pos: number, index: number, editor: Editor, attrs: Attrs) => {
	const tableNode = node;
	const numRows = tableNode.childCount;

	const decorations = [];

	for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
		const row = tableNode.child(rowIndex);
		if (!row) continue;

		const cellPos = getTdPosition(tableNode, index, pos, rowIndex);
		if (cellPos === null || cellPos === undefined) continue;

		const cellNode = editor.state.doc.nodeAt(cellPos);
		if (!cellNode) continue;

		decorations.push(Decoration.node(cellPos, cellPos + cellNode.nodeSize, attrs));
	}

	if (decorations.length > 0) {
		editor.view.dispatch(editor.view.state.tr.setMeta("addDecoration", decorations));
	}
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

export const getHoveredData = (event: MouseEvent): HoveredData => {
	const target = event.target as HTMLElement;
	const cell = target.closest("td, th");
	if (!cell) return { rowIndex: -1, cellIndex: -1 };

	const row = cell.closest("tr");
	const rows = Array.from(row.parentElement.children).filter((child) => child.childElementCount);
	const rowIndex = rows.indexOf(row);
	const cellIndex = Array.from(row.children)
		.filter((child) => child.childElementCount)
		.indexOf(cell);

	let offset = 0;

	if (rows[0].childElementCount === 1 && rows[0].firstElementChild.getAttribute("rowSpan") !== "1") offset = 1;

	return { rowIndex, cellIndex: Math.min(cellIndex, rows[0].childElementCount - offset) };
};

export const getTableSizes = (table: HTMLTableElement): { cols: string[]; rows: string[] } => {
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

	let ignoreRows = 0;
	arrayRows.forEach((row: HTMLTableRowElement, index) => {
		if (ignoreRows > 0) {
			ignoreRows--;
			return;
		}

		const firstTD = row.firstElementChild as HTMLTableColElement;
		const rowSpan = +firstTD.attributes.getNamedItem("rowspan")?.value || 1;
		const height =
			rowSpan > 1
				? arrayRows
						.slice(index, index + rowSpan)
						.reduce((acc, row: HTMLTableRowElement) => acc + row.getBoundingClientRect().height, 0)
				: row.getBoundingClientRect().height;

		rows.push(height + "px");
		if (rowSpan > 1) ignoreRows = rowSpan - 1;
	});

	return { cols, rows };
};
