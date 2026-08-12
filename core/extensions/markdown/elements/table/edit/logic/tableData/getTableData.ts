import {
	type AggregationMethod,
	type ColumnData,
	type TableAggregationCellData,
	type TableDataExtended,
	TableHeaderTypes,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import type { Node } from "@tiptap/pm/model";

export const canUseSortFilter = (header: TableHeaderTypes) =>
	header === TableHeaderTypes.ROW || header === TableHeaderTypes.BOTH;

const getTableData = (node: Node): TableDataExtended | null => {
	const header = node.attrs.header as TableHeaderTypes;
	if (node.childCount === 0) return null;

	let numCols = 0;
	const aggregationCells: TableAggregationCellData[] = [];
	const aggregationColumnsData: ColumnData[] = [];
	let hasAggregation = false;
	const firstRow = node.child(0);
	firstRow.forEach((cell, _, realColStart) => {
		const colspan = cell.attrs.colspan || 1;
		const method = (cell.attrs.aggregation || null) as AggregationMethod | null;
		const data: ColumnData = [];

		if (method) hasAggregation = true;
		aggregationColumnsData[numCols] = data;
		aggregationCells.push({
			method,
			data,
			align: cell.attrs.align,
			colspan,
			visualColStart: numCols,
			realColStart,
		});

		numCols += colspan;
	});

	const sortFilterEnabled = canUseSortFilter(header);
	if (!sortFilterEnabled && !hasAggregation) return null;
	if (numCols === 0) return null;

	const numRows = node.childCount;
	const rows: TableDataExtended["rows"] = Array.from({ length: numRows }, () => ({
		cells: Array(numCols).fill(null),
	}));

	const colOccupiedUntil = new Array(numCols).fill(-1);
	const aggregationStartRow = sortFilterEnabled ? 1 : 0;

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

					if (hasAggregation && currentRowIdx >= aggregationStartRow) {
						aggregationColumnsData[targetCol]?.push(r === 0 && c === 0 ? text : "");
					}
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

	return {
		rows,
		numRows,
		numCols,
		sortFilter: {
			enabled: sortFilterEnabled,
		},
		aggregation: {
			enabled: hasAggregation,
			cells: hasAggregation ? aggregationCells : [],
		},
	};
};

export default getTableData;
