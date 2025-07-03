import { useDebounce } from "@core-ui/hooks/useDebounce";
import t from "@ext/localization/locale/translate";
import parseNumber from "@ext/markdown/elements/table/edit/logic/parseNumber";
import {
	AggregationData,
	AggregationMethod,
	AlignEnumTypes,
	ColumnData,
} from "@ext/markdown/elements/table/edit/model/tableTypes";
import { Fragment } from "@tiptap/pm/model";
import { RefObject, useEffect } from "react";
import Sheet, { SheetColumn, SheetType } from "@core-ui/utils/Sheet";

const NULL_VALUE = "-";
const AGGREGATIONS_FUNCS = {
	[AggregationMethod.SUM]: (data: ColumnData) => {
		const numericData = data.map(parseNumber).filter((d) => Number.isFinite(d));
		return numericData.length ? numericData.reduce((acc, curr) => acc + curr, 0) : 0;
	},
	[AggregationMethod.AVG]: (data: ColumnData) => {
		const numericData = data.map(parseNumber).filter((d) => Number.isFinite(d));
		return numericData.length ? numericData.reduce((acc, curr) => acc + curr, 0) / numericData.length : 0;
	},
	[AggregationMethod.MIN]: (data: ColumnData) => {
		const numericData = data.map(parseNumber).filter((d) => Number.isFinite(d));
		return numericData.length ? Math.min(...numericData) : 0;
	},
	[AggregationMethod.MAX]: (data: ColumnData) => {
		const numericData = data.map(parseNumber).filter((d) => Number.isFinite(d));
		return numericData.length ? Math.max(...numericData) : 0;
	},
	[AggregationMethod.COUNT]: (data: ColumnData) => data.length,
	[AggregationMethod.COUNT_DISTINCT]: (data: ColumnData) => new Set(data).size,
};

export const getFormatter = () =>
	new Intl.NumberFormat(navigator.languages, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

	textNode.textContent = `${t(`editor.table.aggregation.methods.${method}.name`)}: ${formattedValue}`;
};

const createRow = (table: HTMLTableElement, sheet: Sheet<string>, hasHeader: boolean) => {
	const row = table.lastElementChild.appendChild(document.createElement("tr"));
	row.contentEditable = "false";
	row.dataset.aggregation = "true";

	const data = getAggregationData(sheet, hasHeader, table);
	const formatter = getFormatter();
	const sheetData = sheet.getSheet();
	const physicalCellCount = sheetData[0]?.length || 0;

	let logicalIndex = 0;
	for (let physicalIndex = 0; physicalIndex < physicalCellCount; physicalIndex++) {
		if (sheet.isCellMerged(0, physicalIndex)) {
			const masterCell = sheet.getMasterCell(0, physicalIndex);
			if (masterCell && masterCell.column !== physicalIndex) {
				continue;
			}
		}

		const previousCell = table.rows[table.rows.length - 2].cells[physicalIndex];
		const cell = row.appendChild(document.createElement("td"));

		cell.contentEditable = "false";
		cell.setAttribute("align", previousCell?.getAttribute("align") || AlignEnumTypes.LEFT);
		cell.appendChild(document.createTextNode(""));

		if (sheet.isCellMerged(0, physicalIndex)) {
			const masterCell = sheet.getMasterCell(0, physicalIndex);
			if (masterCell && masterCell.column === physicalIndex) {
				const cellSpan = sheet.getCellSpan(masterCell.row, masterCell.column);
				if (cellSpan && cellSpan.colspan > 1) {
					cell.setAttribute("colspan", cellSpan.colspan.toString());
				}
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
	for (let i = 0; i < table.rows[0]?.cells?.length; i++) {
		const child = table.rows[0]?.cells?.[i];
		if (child?.getAttribute("aggregation")) return true;
	}

	return false;
};

export const getCellsColumnData = (cols: HTMLTableCellElement[]): ColumnData => {
	const data: ColumnData = [];

	for (let colIndex = 0; colIndex < cols.length; colIndex++) {
		const cell = cols[colIndex];
		if (!cell) continue;

		data.push(cell.textContent?.trim() || "");
	}

	return data;
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
	const isColumnHeader = table?.dataset.header === "column";

	const startCol = isColumnHeader ? 0 : 0;
	const startRow = hasHeader ? 1 : 0;

	const lastRow = table?.lastElementChild?.lastElementChild as HTMLElement;
	const lastRowIsAggregated = lastRow?.dataset.aggregation === "true";

	const getCellsColumnData = (cells: SheetColumn<string>): ColumnData => {
		const data: ColumnData = [];

		for (let colIndex = 0; colIndex < cells.length; colIndex++) {
			const cell = cells[colIndex];
			if (!cell) continue;

			data.push(cell);
		}

		return data;
	};

	for (let colIndex = startCol; colIndex < maxCols; colIndex++) {
		const method = table?.rows[0]?.cells[colIndex]?.getAttribute("aggregation") as AggregationMethod;
		if (!method) {
			data.push({ method: null, data: [] });
			continue;
		}

		const columnData = getCellsColumnData(sheet.getColumn(colIndex)).slice(
			startRow,
			lastRowIsAggregated ? -1 : undefined,
		);

		data.push({ method, data: columnData });
	}

	return data;
};

export const useAggregation = (tableRef: RefObject<HTMLTableElement>, content?: Fragment) => {
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

		if (!isAggregatedRow) createRow(table, sheet, hasHeader);
		else if (isAggregatedRow && lastRowChildCount !== table.rows[0].cells.length) {
			updateRow(table, sheet, hasHeader);
		} else if (isAggregatedRow && lastRowChildCount === table.rows[0].cells.length) {
			updateDebounce.cancel();
			updateDebounce.start(() => updateCellsData(table, sheet, hasHeader));
		}
	}, [tableRef.current, content]);
};

export const convertHtmlTableToSheet = (table: HTMLTableElement): Sheet<string> => {
	let maxColumns = 0;
	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
		const htmlRow = table.rows[rowIndex];

		if (htmlRow.dataset.aggregation === "true") {
			continue;
		}

		let colCount = 0;

		for (let cellIndex = 0; cellIndex < htmlRow.cells.length; cellIndex++) {
			const cell = htmlRow.cells[cellIndex];
			const colspan = parseInt(cell.getAttribute("colspan") || "1");
			colCount += colspan;
		}

		maxColumns = Math.max(maxColumns, colCount);
	}

	const data: SheetType<string> = [];
	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
		data.push(new Array(maxColumns).fill(""));
	}

	const occupied: boolean[][] = [];
	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
		occupied.push(new Array(maxColumns).fill(false));
	}

	const mergeCells: Array<{ startRow: number; startCol: number; endRow: number; endCol: number }> = [];

	for (let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
		const htmlRow = table.rows[rowIndex];
		let dataColIndex = 0;

		for (let cellIndex = 0; cellIndex < htmlRow.cells.length; cellIndex++) {
			const cell = htmlRow.cells[cellIndex];
			const cellText = cell.textContent?.trim() || "";
			const colspan = parseInt(cell.getAttribute("colspan") || "1");
			const rowspan = parseInt(cell.getAttribute("rowspan") || "1");

			while (dataColIndex < maxColumns && occupied[rowIndex][dataColIndex]) {
				dataColIndex++;
			}

			if (dataColIndex < maxColumns) {
				data[rowIndex][dataColIndex] = cellText;

				for (let r = 0; r < rowspan; r++) {
					for (let c = 0; c < colspan; c++) {
						const targetRow = rowIndex + r;
						const targetCol = dataColIndex + c;

						if (targetRow < data.length && targetCol < maxColumns) {
							occupied[targetRow][targetCol] = true;
							if (r !== 0 || c !== 0) {
								data[targetRow][targetCol] = "";
							}
						}
					}
				}

				if (colspan > 1 || rowspan > 1) {
					const endRow = Math.min(rowIndex + rowspan - 1, data.length - 1);
					const endCol = Math.min(dataColIndex + colspan - 1, maxColumns - 1);
					mergeCells.push({
						startRow: rowIndex,
						startCol: dataColIndex,
						endRow,
						endCol,
					});
				}
			}

			dataColIndex++;
		}
	}

	const sheet = Sheet.fromArray(data);

	for (const merge of mergeCells) {
		sheet.mergeCells(merge.startRow, merge.startCol, merge.endRow, merge.endCol);
	}

	return sheet;
};
