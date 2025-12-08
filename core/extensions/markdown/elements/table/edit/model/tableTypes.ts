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

export type ColumnData = string[];

export type AggregationData = {
	method: AggregationMethod;
	data: ColumnData;
}[];

export type HoveredData = { rowIndex: number; cellIndex: number };
