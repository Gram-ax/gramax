import {
	type FilterState,
	type SortRecord,
	SortState,
	type TableDataExtended,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import React, { type ReactElement } from "react";

type RowMoveMap = Record<number, number>;

const hasActiveEntries = (sort: SortRecord) => Object.values(sort).some((v) => v);

const getRowMoves = (tableData: TableDataExtended, activeSort: SortRecord, sortingOrder: number[]): RowMoveMap => {
	const body = tableData.rows.slice(1);

	if (body.length === 0) return {};

	const activeColumns = sortingOrder.filter(
		(col) => activeSort[col] === SortState.ASC || activeSort[col] === SortState.DESC,
	);

	if (activeColumns.length === 0) {
		return {};
	}

	const indexed = body.map((row, i) => ({
		row: row.cells,
		index: i + 1,
		initialOrder: row.initialOrder ?? tableData.numRows + i,
	}));

	indexed.sort((a, b) => {
		for (const colIndex of activeColumns) {
			const direction = activeSort[colIndex];
			if (!direction) continue;

			const aVal = a.row[colIndex].text ?? "";
			const bVal = b.row[colIndex].text ?? "";

			const result = aVal.localeCompare(bVal, undefined, { numeric: true });

			if (result !== 0) {
				return direction === SortState.ASC ? result : -result;
			}
		}
		return a.initialOrder - b.initialOrder;
	});

	const moves: RowMoveMap = {};

	indexed.forEach((entry, newIdx) => {
		const newRowIndex = newIdx + 1;
		if (entry.index !== newRowIndex) {
			moves[entry.index] = newRowIndex;
		}
	});

	return moves;
};

const canSortTable = ({ headerRow, rowsArray }: { headerRow: ReactElement; rowsArray: ReactElement[] }) => {
	const cells: ReactElement[] = headerRow.props.children || [];
	cells.concat(rowsArray.flatMap((row) => row.props.children || []));
	return cells.every(
		(c: ReactElement) => (!c.props.colspan || c.props.colspan === 1) && (!c.props.rowspan || c.props.rowspan === 1),
	);
};

const getSaved = (headerRow: ReactElement) => {
	const filter: FilterState = {};
	const sort: SortRecord = {};

	const cells = headerRow.props.children || [];

	cells.forEach((cell: ReactElement, colIndex: number) => {
		const colFilter = cell.props.filter;
		if (colFilter && Array.isArray(colFilter)) {
			filter[colIndex] = colFilter;
		}

		const colSort = cell.props.sort;
		if (colSort === "asc" || colSort === "desc") {
			sort[colIndex] = colSort;
		}
	});

	const tableAttrs = headerRow.props?.parentTableProps || headerRow.props || {};
	const sortingOrder: number[] = tableAttrs.sortingOrder || [];

	return {
		filter,
		sort,
		sortingOrder,
	};
};

const sortOrder = (
	rows: {
		headerRow: ReactElement;
		rowsArray: ReactElement[];
	},
	tableData: TableDataExtended,
	sort: SortRecord,
	sortingOrder: number[],
) => {
	const { headerRow, rowsArray } = rows;
	if (!rows.rowsArray?.length) return rowsArray;

	const moves = getRowMoves(tableData, sort, sortingOrder);
	const alreadySorted = !Object.keys(moves).length && headerRow.props?.initialOrder !== undefined;
	if (alreadySorted) return rowsArray;

	const sortedRows = [...rowsArray].sort((a, b) => {
		const aIdx = rowsArray.indexOf(a) + 1;
		const bIdx = rowsArray.indexOf(b) + 1;

		return (moves[aIdx] ?? aIdx) - (moves[bIdx] ?? bIdx);
	});

	return sortedRows.map((row) => {
		const originalIndex = rowsArray.indexOf(row) + 1;
		return React.cloneElement(row, {
			initialOrder: row.props?.initialOrder ?? originalIndex,
		});
	});
};

const restoreOrder = (rowsArray: ReactElement[]) => {
	if (!rowsArray.length) return rowsArray;

	const restored = rowsArray.sort((a, b) => (a.props?.initialOrder ?? 0) - (b.props?.initialOrder ?? 0));
	return restored.map((row) => React.cloneElement(row, row.props));
};

export { canSortTable, getRowMoves, getSaved, hasActiveEntries, restoreOrder, sortOrder };
