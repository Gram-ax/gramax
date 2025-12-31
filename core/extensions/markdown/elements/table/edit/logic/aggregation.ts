import { useDebounce } from "@core-ui/hooks/useDebounce";
import parseNumber from "@ext/markdown/elements/table/edit/logic/parseNumber";
import {
	AggregationData,
	AggregationMethod,
	AlignEnumTypes,
	ColumnData,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { DependencyList, RefObject, useEffect } from "react";
import Sheet, { SheetType } from "@core-ui/utils/Sheet";

const NULL_VALUE = "-";

const getNumericData = (data: ColumnData): number[] => {
	const result: number[] = [];
	for (let i = 0; i < data.length; i++) {
		const num = parseNumber(data[i]);
		if (Number.isFinite(num)) result.push(num);
	}
	return result;
};

const AGGREGATIONS_FUNCS = {
	[AggregationMethod.SUM]: (data: ColumnData) => {
		const numericData = getNumericData(data);
		if (!numericData.length) return 0;
		let sum = 0;
		for (let i = 0; i < numericData.length; i++) sum += numericData[i];
		return sum;
	},
	[AggregationMethod.AVG]: (data: ColumnData) => {
		const numericData = getNumericData(data);
		if (!numericData.length) return 0;
		let sum = 0;
		for (let i = 0; i < numericData.length; i++) sum += numericData[i];
		return sum / numericData.length;
	},
	[AggregationMethod.MIN]: (data: ColumnData) => {
		const numericData = getNumericData(data);
		return numericData.length ? Math.min(...numericData) : 0;
	},
	[AggregationMethod.MAX]: (data: ColumnData) => {
		const numericData = getNumericData(data);
		return numericData.length ? Math.max(...numericData) : 0;
	},
	[AggregationMethod.COUNT]: (data: ColumnData) => data.length,
	[AggregationMethod.COUNT_DISTINCT]: (data: ColumnData) => new Set(data).size,
};

let cachedFormatter: Intl.NumberFormat;
export const getFormatter = () => {
	if (!cachedFormatter) {
		cachedFormatter = new Intl.NumberFormat(navigator.languages, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		});
	}
	return cachedFormatter;
};
export const getFormattedValue = (formatter: Intl.NumberFormat, value: number) => formatter.format(value);
export const getAggregatedValue = (method: AggregationMethod, data: ColumnData) => {
	if (!method || !data.length) return null;

	const filteredData = filterData(data);
	if (!filteredData.length) return null;

	const aggregatedValue = AGGREGATIONS_FUNCS[method](filteredData);

	return aggregatedValue;
};

const filterData = (data: ColumnData): ColumnData => data.filter((d) => d && d?.length);

const updateCellText = (
	formatter: Intl.NumberFormat,
	cell: HTMLTableCellElement,
	method: AggregationMethod,
	data: ColumnData,
) => {
	const textNode = cell.firstChild as Text;
	const value = getAggregatedValue(method, data);
	const formattedValue = value || value === 0 ? getFormattedValue(formatter, value) : NULL_VALUE;
	if (!method) {
		textNode.textContent = "";
		return;
	}

	textNode.textContent = formattedValue;
};

const createRow = (table: HTMLTableElement, sheet: Sheet<string>, hasHeader: boolean) => {
	const row = table.lastElementChild.appendChild(document.createElement("tr"));
	row.contentEditable = "false";
	row.dataset.aggregation = "true";

	const data = getAggregationData(sheet, hasHeader, table);
	const formatter = getFormatter();
	const sheetData = sheet.getSheet();
	const physicalCellCount = sheetData[0]?.length || 0;

	const referenceRowIndex = 1;
	let logicalIndex = 0;
	for (let physicalIndex = 0; physicalIndex < physicalCellCount; physicalIndex++) {
		const isMerged = sheet.isCellMerged(referenceRowIndex, physicalIndex);
		const masterCell = isMerged ? sheet.getMasterCell(referenceRowIndex, physicalIndex) : null;

		if (masterCell && masterCell.column !== physicalIndex) {
			continue;
		}

		const previousCell = table.rows[table.rows.length - 2].cells[physicalIndex];
		const cell = row.appendChild(document.createElement("td"));

		cell.contentEditable = "false";
		cell.setAttribute("align", previousCell?.getAttribute("align") || AlignEnumTypes.LEFT);
		cell.appendChild(document.createTextNode(""));

		if (masterCell && masterCell.column === physicalIndex) {
			const cellSpan = sheet.getCellSpan(masterCell.row, masterCell.column);
			if (cellSpan && cellSpan.colspan > 1) {
				cell.setAttribute("colspan", cellSpan.colspan.toString());
			}
		}

		updateCellText(formatter, cell, data[logicalIndex]?.method, data[logicalIndex]?.data);
		logicalIndex++;
	}
};

const deleteRow = (table: HTMLTableElement) => {
	const lastRow = table.lastElementChild.lastElementChild as HTMLTableRowElement;
	lastRow.remove();
};

const updateRow = (table: HTMLTableElement, sheet: Sheet<string>, hasHeader: boolean) => {
	deleteRow(table);
	createRow(table, sheet, hasHeader);
};

const updateCellsData = (table: HTMLTableElement, sheet: Sheet<string>, hasHeader: boolean) => {
	const data = getAggregationData(sheet, hasHeader, table);
	const formatter = getFormatter();
	const cells = table.lastElementChild.lastElementChild.children;

	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i] as HTMLTableCellElement;
		if (!cell) continue;

		const previousCell = table.rows[table.rows.length - 2].cells[i];
		if (!previousCell) continue;

		cell.setAttribute("align", previousCell.getAttribute("align") || AlignEnumTypes.LEFT);
		updateCellText(formatter, cell, data[i]?.method, data[i]?.data);
	}
};

const isAggregatedTable = (table: HTMLTableElement) => {
	const rowToCheck = table.rows[1];
	if (!rowToCheck) return false;

	for (let i = 0; i < rowToCheck.cells?.length; i++) {
		const child = rowToCheck.cells?.[i];
		if (child?.getAttribute("aggregation")) return true;
	}

	return false;
};

export const getCellsInColumn = (table: HTMLTableElement, colIndex: number): HTMLTableCellElement[] => {
	const cells: HTMLTableCellElement[] = [];

	for (let i = 0; i < table.rows.length; i++) {
		cells.push(table.rows[i].cells[colIndex]);
	}

	return cells;
};

const getAggregationData = (
	sheet: Sheet<string>,
	hasHeader: boolean = false,
	table?: HTMLTableElement,
): AggregationData => {
	const data: AggregationData = [];
	const sheetData = sheet.getSheet();
	const maxCols = sheetData[0]?.length || 0;
	const startRow = hasHeader ? 1 : 0;

	for (let colIndex = 0; colIndex < maxCols; colIndex++) {
		const method = table?.rows[1]?.cells[colIndex]?.getAttribute("aggregation") as AggregationMethod;
		if (!method) {
			data.push({ method: null, data: [] });
			continue;
		}

		const columnData = sheet.getColumn(colIndex).slice(startRow);

		data.push({ method, data: columnData });
	}

	return data;
};

export const useAggregation = (tableRef: RefObject<HTMLTableElement>, deps?: DependencyList) => {
	const updateDebounce = useDebounce((f: () => void) => f(), 200);

	useEffect(() => {
		const table = tableRef.current;
		const sheet = convertHtmlTableToSheet(table);
		if (!table || !sheet) return;

		const isAgreggated = isAggregatedTable(table);

		const tbody = table.lastElementChild;
		const lastRow = tbody.lastElementChild as HTMLTableRowElement;
		if (!lastRow) return;

		const isAggregatedRow = lastRow.dataset.aggregation === "true";
		if (!isAgreggated) {
			if (isAggregatedRow) deleteRow(table);

			return;
		}

		const hasHeader = table.dataset.header !== "none";
		const lastRowChildCount = lastRow.childElementCount;
		const referenceCellCount = table.rows[1]?.cells.length || 0;

		if (!isAggregatedRow) createRow(table, sheet, hasHeader);
		else if (isAggregatedRow && lastRowChildCount !== referenceCellCount) {
			updateRow(table, sheet, hasHeader);
		} else if (isAggregatedRow && lastRowChildCount === referenceCellCount) {
			updateDebounce.cancel();
			updateDebounce.start(() => updateCellsData(table, sheet, hasHeader));
		}
	}, [tableRef.current, ...(deps || [])]);
};

export const convertHtmlTableToSheet = (table: HTMLTableElement): Sheet<string> => {
	let maxColumns = 0;
	let rowCount = 0;
	for (let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
		const htmlRow = table.rows[rowIndex];
		if (htmlRow.dataset.aggregation === "true") continue;

		rowCount++;
		let colCount = 0;
		for (let cellIndex = 0; cellIndex < htmlRow.cells.length; cellIndex++) {
			const cell = htmlRow.cells[cellIndex];
			const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
			colCount += colspan;
		}
		maxColumns = Math.max(maxColumns, colCount);
	}

	const data: SheetType<string> = new Array(rowCount);
	const occupied: boolean[][] = new Array(rowCount);
	for (let i = 0; i < rowCount; i++) {
		data[i] = new Array(maxColumns).fill("");
		occupied[i] = new Array(maxColumns).fill(false);
	}

	const mergeCells: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }> = [];

	let dataRowIndex = 0;
	for (let rowIndex = 1; rowIndex < table.rows.length; rowIndex++) {
		const htmlRow = table.rows[rowIndex];
		if (htmlRow.dataset.aggregation === "true") continue;

		let dataColIndex = 0;
		for (let cellIndex = 0; cellIndex < htmlRow.cells.length; cellIndex++) {
			const cell = htmlRow.cells[cellIndex];
			const cellText = cell.textContent?.trim() || "";
			const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
			const rowspan = parseInt(cell.getAttribute("rowspan") || "1", 10);

			while (dataColIndex < maxColumns && occupied[dataRowIndex][dataColIndex]) {
				dataColIndex++;
			}

			if (dataColIndex < maxColumns) {
				data[dataRowIndex][dataColIndex] = cellText;

				for (let r = 0; r < rowspan; r++) {
					for (let c = 0; c < colspan; c++) {
						const targetRow = dataRowIndex + r;
						const targetCol = dataColIndex + c;

						if (targetRow < rowCount && targetCol < maxColumns) {
							occupied[targetRow][targetCol] = true;
							if (r !== 0 || c !== 0) {
								data[targetRow][targetCol] = "";
							}
						}
					}
				}

				if (colspan > 1 || rowspan > 1) {
					const endRow = Math.min(dataRowIndex + rowspan - 1, rowCount - 1);
					const endCol = Math.min(dataColIndex + colspan - 1, maxColumns - 1);
					mergeCells.push({
						startRow: dataRowIndex,
						startCol: dataColIndex,
						endRow,
						endCol,
					});
				}
			}

			dataColIndex++;
		}
		dataRowIndex++;
	}

	const sheet = Sheet.fromArray(data);

	for (const merge of mergeCells) {
		sheet.mergeCells(merge.startRow, merge.startCol, merge.endRow, merge.endCol);
	}

	return sheet;
};
