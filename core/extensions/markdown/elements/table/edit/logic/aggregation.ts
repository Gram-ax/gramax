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

const createRow = (table: HTMLTableElement, hasHeader: boolean) => {
	const row = table.lastElementChild.appendChild(document.createElement("tr"));
	row.contentEditable = "false";
	row.dataset.aggregation = "true";

	const data = getAggregationData(table, hasHeader);
	const formatter = getFormatter();

	for (let i = 0; i < table.rows[0].cells.length; i++) {
		const previousCell = table.rows[table.rows.length - 2].cells[i];
		const cell = row.appendChild(document.createElement("td"));

		cell.contentEditable = "false";
		cell.setAttribute("align", previousCell.getAttribute("align") || AlignEnumTypes.LEFT);
		cell.appendChild(document.createTextNode(""));

		updateCellText(formatter, cell, data[i]?.method, data[i]?.data);
	}
};

const deleteRow = (table: HTMLTableElement) => {
	const lastRow = table.lastElementChild.lastElementChild as HTMLTableRowElement;
	lastRow.remove();
};

const updateRow = (table: HTMLTableElement, hasHeader: boolean) => {
	deleteRow(table);
	createRow(table, hasHeader);
};

const updateCellsData = (table: HTMLTableElement, hasHeader: boolean) => {
	const data = getAggregationData(table, hasHeader);
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

const getAggregationData = (table: HTMLTableElement, hasHeader: boolean = false): AggregationData => {
	const data: AggregationData = [];
	const isRowHeader = table.dataset.header === "row";
	const isColumnHeader = table.dataset.header === "column";
	const startRow = hasHeader && isRowHeader ? 1 : 0;
	const startCol = hasHeader && isColumnHeader ? 1 : 0;

	if (startCol) data.push({ method: null, data: [] });

	for (let colIndex = startCol; colIndex < table.rows[0].cells.length; colIndex++) {
		const firstCell = table.rows[0].cells[colIndex];
		const method = firstCell.getAttribute("aggregation") as AggregationMethod;

		if (!method) {
			data.push({ method: null, data: [] });
			continue;
		}

		const cells = getCellsInColumn(table, colIndex).slice(startRow, table.rows.length - 1);
		const columnData = getCellsColumnData(cells);
		data.push({ method, data: columnData });
	}

	return data;
};

export const useAggregation = (tableRef: RefObject<HTMLTableElement>, content?: Fragment) => {
	const updateDebounce = useDebounce((f: () => void) => f(), 200);

	useEffect(() => {
		const table = tableRef.current;
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

		if (!isAggregatedRow) createRow(table, hasHeader);
		else if (isAggregatedRow && lastRowChildCount !== table.rows[0].cells.length) updateRow(table, hasHeader);
		else if (isAggregatedRow && lastRowChildCount === table.rows[0].cells.length) {
			updateDebounce.cancel();
			updateDebounce.start(() => updateCellsData(table, hasHeader));
		}
	}, [tableRef.current, content]);
};
