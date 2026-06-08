import {
	type FilterAndSort,
	type FilterState,
	type SortRecord,
	type TableDataExtended,
	TableHeaderTypes,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { getRowMoves } from "@ext/markdown/elements/table/render/logic/sortFilterUtilsRender";
import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";

const getTableData = (node: Node): TableDataExtended | null => {
	const header = node.attrs.header as TableHeaderTypes;
	if (header !== TableHeaderTypes.ROW && header !== TableHeaderTypes.BOTH) return null;

	if (node.childCount === 0) return null;

	let numCols = 0;
	const firstRow = node.child(0);
	firstRow.forEach((cell) => {
		numCols += cell.attrs.colspan || 1;
	});

	const numRows = node.childCount;
	const rows: TableDataExtended["rows"] = Array.from({ length: numRows }, () => ({
		cells: Array(numCols).fill(null),
	}));

	const colOccupiedUntil = new Array(numCols).fill(-1);

	node.forEach((rowNode, _, currentRowIdx) => {
		let visualCol = 0;
		rows[currentRowIdx].initialOrder = rowNode.attrs?.initialOrder;

		while (visualCol < numCols && currentRowIdx <= colOccupiedUntil[visualCol]) {
			visualCol++;
		}

		rowNode.forEach((cellNode, _, realColStart) => {
			while (visualCol < numCols && currentRowIdx <= colOccupiedUntil[visualCol]) {
				visualCol++;
			}
			if (visualCol >= numCols) return;

			const colspan = cellNode.attrs.colspan || 1;
			const rowspan = cellNode.attrs.rowspan || 1;
			const text = cellNode.textContent || "";

			for (let r = 0; r < rowspan; r++) {
				const targetRow = currentRowIdx + r;
				if (targetRow >= numRows) break;

				for (let c = 0; c < colspan; c++) {
					const targetCol = visualCol + c;
					if (targetCol >= numCols) continue;

					const targetRowCells = rows[targetRow].cells;
					targetRowCells[targetCol] = {
						text,
						rowspan,
						colspan,
						realRowStart: currentRowIdx,
						visualColStart: visualCol,
						realColStart,
					};
				}
			}

			for (let c = 0; c < colspan; c++) {
				const targetCol = visualCol + c;
				if (targetCol < numCols) {
					colOccupiedUntil[targetCol] = currentRowIdx + rowspan - 1;
				}
			}

			visualCol += colspan;
		});
	});

	return { rows, numRows, numCols };
};

const getSaved = (node: Node): FilterAndSort => {
	const firstRow = node.firstChild;
	const sortingOrder = (node.attrs.sortingOrder || []) as number[];
	const filter: FilterState = {};
	const sort: SortRecord = {};

	if (!firstRow) {
		return { filter, sort, sortingOrder: [] };
	}

	firstRow.forEach((cell, _offset, colIndex) => {
		const colFilter = cell.attrs.filter;
		if (colFilter) filter[colIndex] = colFilter;

		const colSort = cell.attrs.sort;
		if (colSort) sort[colIndex] = colSort;
	});

	return { filter, sort, sortingOrder };
};

const getTableRows = (tableNode: Node) => {
	const headerRow = tableNode.child(0);
	const bodyRows: Node[] = [];
	for (let i = 1; i < tableNode.childCount; i++) bodyRows.push(tableNode.child(i));
	return { headerRow, bodyRows };
};

const sortRows = (
	tableData: TableDataExtended,
	activeSort: SortRecord,
	sortingOrder: number[],
	editor: Editor,
	tablePos: number,
) => {
	const { state, view } = editor;
	const tableNode = state.doc.nodeAt(tablePos);
	if (!tableNode) return;

	const moves = getRowMoves(tableData, activeSort, sortingOrder);
	const alreadySorted = !Object.keys(moves).length && tableNode.child(0).attrs.initialOrder !== null;
	if (alreadySorted) return;

	const { headerRow, bodyRows } = getTableRows(tableNode);

	const sortedRows = [...bodyRows].sort((a, b) => {
		const aIdx = bodyRows.indexOf(a) + 1;
		const bIdx = bodyRows.indexOf(b) + 1;
		return (moves[aIdx] ?? aIdx) - (moves[bIdx] ?? bIdx);
	});

	const initialOrdersRecord: Record<number, number> = {};

	const initialOrders = sortedRows.map((row, index) => {
		const initialOrder = row.attrs.initialOrder ?? bodyRows.length + 1 + bodyRows.indexOf(row);
		initialOrdersRecord[index] = initialOrder;
		return initialOrder;
	});

	initialOrders.sort((a, b) => a - b);

	const newRows = [
		headerRow.type.create({ ...headerRow.attrs, initialOrder: 0 }, headerRow.content, headerRow.marks),
		...sortedRows.map((row, index) => {
			const currentInitialOrder = initialOrdersRecord[index];
			const newInitialOrder = initialOrders.indexOf(currentInitialOrder) + 1;

			return row.type.create({ ...row.attrs, initialOrder: newInitialOrder }, row.content, row.marks);
		}),
	];

	const tr = state.tr;
	tr.replaceWith(
		tablePos,
		tablePos + tableNode.nodeSize,
		tableNode.type.create(tableNode.attrs, newRows, tableNode.marks),
	);
	view.dispatch(tr);
};

const restoreOrder = (editor: Editor, tablePos: number) => {
	const { state, view } = editor;
	const tableNode = state.doc.nodeAt(tablePos);
	if (!tableNode) return;

	if (tableNode.child(0).attrs.initialOrder === null) return;

	const { headerRow, bodyRows } = getTableRows(tableNode);
	const restoredRows = [...bodyRows].sort(
		(a, b) =>
			(a.attrs.initialOrder ?? bodyRows.length + 1 + bodyRows.indexOf(a)) -
			(b.attrs.initialOrder ?? bodyRows.length + 1 + bodyRows.indexOf(b)),
	);

	const newRows = [
		headerRow.type.create({ ...headerRow.attrs, initialOrder: null }, headerRow.content, headerRow.marks),
		...restoredRows.map((row) => row.type.create({ ...row.attrs, initialOrder: null }, row.content, row.marks)),
	];

	const tr = state.tr;
	tr.replaceWith(
		tablePos,
		tablePos + tableNode.nodeSize,
		tableNode.type.create(tableNode.attrs, newRows, tableNode.marks),
	);
	view.dispatch(tr);
};

export { type FilterAndSort, getSaved, getTableData, restoreOrder, sortRows };
