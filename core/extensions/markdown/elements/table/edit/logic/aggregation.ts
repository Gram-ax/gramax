import parseNumber from "@ext/markdown/elements/table/edit/logic/parseNumber";
import { AggregationMethod, type ColumnData } from "@ext/markdown/elements/table/edit/model/tableTypes";

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

const filterData = (data: ColumnData): ColumnData => data.filter((d) => d?.length);

export const getCellsInColumn = (table: HTMLTableSectionElement, colIndex: number): HTMLTableCellElement[] => {
	const cells: HTMLTableCellElement[] = [];

	for (let i = 0; i < table.rows.length; i++) {
		cells.push(table.rows[i].cells[colIndex]);
	}

	return cells;
};
