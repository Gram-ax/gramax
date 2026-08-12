import { canUseSortFilter } from "@ext/markdown/elements/table/edit/logic/tableData/getTableData";
import type {
	AggregationMethod,
	AlignEnumTypes,
	ColumnData,
	TableAggregationCellData,
	TableDataExtended,
	TableHeaderTypes,
} from "@ext/markdown/elements/table/edit/model/tableTypes";

const getTableData = (node: HTMLTableElement, header: TableHeaderTypes): TableDataExtended | null => {
	const tbody = node.querySelector(":scope > tbody") as HTMLTableSectionElement;
	if (!tbody) return null;

	const rowElements = [...tbody.children].filter((el): el is HTMLTableRowElement => el.tagName === "TR");

	if (rowElements.length === 0) return null;

	let numCols = 0;
	const aggregationCells: TableAggregationCellData[] = [];
	const aggregationColumnsData: ColumnData[] = [];
	let hasAggregation = false;
	const firstRow = rowElements[0];
	for (const cell of firstRow.cells) {
		const colspan = cell.colSpan || 1;
		const method = (cell.getAttribute("aggregation") || null) as AggregationMethod | null;
		const data: ColumnData = [];

		if (method) hasAggregation = true;
		aggregationColumnsData[numCols] = data;
		aggregationCells.push({
			method,
			data,
			align: cell.getAttribute("align") as AlignEnumTypes,
			colspan,
			visualColStart: numCols,
			realColStart: cell.cellIndex,
		});

		numCols += colspan;
	}

	const sortFilterEnabled = canUseSortFilter(header);
	if (!sortFilterEnabled && !hasAggregation) return null;
	if (numCols === 0) return null;

	const numRows = rowElements.length;

	const rows: TableDataExtended["rows"] = Array.from({ length: numRows }, () => ({
		cells: Array(numCols).fill(null),
	}));

	const colOccupiedUntil: number[] = new Array(numCols).fill(-1);
	const aggregationStartRow = sortFilterEnabled ? 1 : 0;

	rowElements.forEach((row, rowIndex) => {
		const initialOrder = parseInt(row.dataset.initialOrder, 10);
		rows[rowIndex].initialOrder = Number.isInteger(initialOrder) ? initialOrder : undefined;

		let visualCol = 0;

		while (visualCol < numCols && rowIndex <= colOccupiedUntil[visualCol]) {
			visualCol++;
		}

		[...row.cells].forEach((cell, realColStart) => {
			while (visualCol < numCols && rowIndex <= colOccupiedUntil[visualCol]) {
				visualCol++;
			}
			if (visualCol >= numCols) return;

			const colspan = cell.colSpan || 1;
			const rowspan = cell.rowSpan || 1;
			const text = cell.textContent?.trim() || "";

			for (let r = 0; r < rowspan; r++) {
				const targetRow = rowIndex + r;
				if (targetRow >= numRows) return;

				for (let c = 0; c < colspan; c++) {
					const targetCol = visualCol + c;
					if (targetCol >= numCols) continue;

					const targetRowCells = rows[targetRow].cells;
					targetRowCells[targetCol] = {
						text,
						rowspan,
						colspan,
						realRowStart: rowIndex,
						visualColStart: visualCol,
						realColStart,
					};

					if (hasAggregation && rowIndex >= aggregationStartRow) {
						aggregationColumnsData[targetCol]?.push(r === 0 && c === 0 ? text : "");
					}
				}
			}

			for (let c = 0; c < colspan; c++) {
				const targetCol = visualCol + c;
				if (targetCol < numCols) {
					colOccupiedUntil[targetCol] = rowIndex + rowspan - 1;
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
