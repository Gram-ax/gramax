import { MetricsTableRow } from "./components/table/MetricsTableConfig";
import { MetricsInterval } from "./utils";

export interface ChartDataPoint {
	date: string;
	views: number;
	visits: number;
	visitors: number;
}

export interface MetricsConfigSettings {
	enabled: boolean;
}

export interface MetricsSettings extends MetricsConfigSettings {
	chartData: ChartDataPoint[];
	tableData: MetricsTableRow[];
	hasMore: boolean;
	nextCursor: number | null;
	interval: MetricsInterval;
}

export interface TableDataResponse {
	data: MetricsTableRow[];
	hasMore: boolean;
	nextCursor: number | null;
}
