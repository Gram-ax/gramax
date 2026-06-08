export enum HoverEnumTypes {
	DELETE = "delete",
	ADD = "add",
}

export enum AlignEnumTypes {
	LEFT = "left",
	CENTER = "center",
	RIGHT = "right",
}

export enum AggregationMethod {
	SUM = "sum",
	AVG = "avg",
	MIN = "min",
	MAX = "max",
	COUNT = "count",
	COUNT_DISTINCT = "countDistinct",
}

export const aggregationMethodIcons: { [type in AggregationMethod]: string } = {
	[AggregationMethod.SUM]: "circle-plus",
	[AggregationMethod.AVG]: "circle-percent",
	[AggregationMethod.MIN]: "circle-arrow-down",
	[AggregationMethod.MAX]: "circle-arrow-up",
	[AggregationMethod.COUNT]: "hash",
	[AggregationMethod.COUNT_DISTINCT]: "hash",
};

export const methodsWithTooltip: Partial<{ [type in AggregationMethod]: boolean }> = {
	[AggregationMethod.COUNT]: true,
	[AggregationMethod.COUNT_DISTINCT]: true,
};

export enum TableHeaderTypes {
	NONE = "none",
	COLUMN = "column",
	ROW = "row",
	BOTH = "both",
}

export enum SortState {
	ASC = "asc",
	DESC = "desc",
}

export type FilterState = Record<number, string[]>;
export type SortRecord = Record<number, SortState>;

export type ColumnData = string[];

export type AggregationData = {
	method: AggregationMethod;
	data: ColumnData;
}[];

export type HoveredData = { rowIndex: number; cellIndex: number };

export type FilterAndSort = {
	filter: FilterState;
	sort: SortRecord;
	sortingOrder: number[];
};

export interface FilterAndSortProps {
	tableData?: TableDataExtended;
	canSort: boolean;
	saved: FilterAndSort;
	active: FilterAndSort;
	onFilterChange: (colIndex: number, excluded: string[]) => void;
	onSortChange: (colIndex: number, sortState: SortState) => void;
	sorted?: boolean;
	columnsValues: string[][];
}

export type TableCellInfo = {
	text: string;
	rowspan: number;
	colspan: number;
	realRowStart: number;
	visualColStart: number;
	realColStart: number;
};

export type TableDataExtended = {
	rows: {
		initialOrder?: number;
		cells: TableCellInfo[];
	}[];
	numRows: number;
	numCols: number;
};
