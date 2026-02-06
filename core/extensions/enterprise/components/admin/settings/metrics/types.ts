import type { SearchMetricsTableRow } from "./search/table/SearchMetricsTableConfig";
import type { MetricsInterval } from "./utils";
import type { MetricsTableRow } from "./view/table/MetricsTableConfig";

export interface ArticleRatingRow {
	catalogName: string;
	articleTitle: string;
	articleUrl: string;
	searchCount: number;
	ctr: number;
	avgPosition: number;
	refinementRate: number;
}

export interface ChartDataPoint {
	date: string;
	views: number;
	visits: number;
	visitors: number;
}

export interface SearchChartDataPoint {
	date: string;
	totalSearches: number;
	avgCTR: number;
	noClickRate: number;
	refinementRate: number;
}

export interface SearchQueryDetailRow {
	articleTitle: string;
	articleUrl: string;
	catalogName: string;
	isRecommended: boolean;
	clicks: number;
	ctr: number;
	avgPosition: number;
}

export interface SearchQueryDetailsResponse {
	data: SearchQueryDetailRow[];
	nextCursor: string | null;
	hasMore: boolean;
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

export interface SearchMetricsSettings {
	chartData: SearchChartDataPoint[];
	tableData: SearchMetricsTableRow[];
	hasMoreTableData: boolean;
	nextTableCursor: string | null;
	interval: MetricsInterval;
	// Query details table (for first/selected query)
	queryDetailsData: SearchQueryDetailRow[];
	hasMoreQueryDetails: boolean;
	nextQueryDetailsCursor: string | null;
	selectedQuery: string | null;
	// Article ratings table
	articleRatingsData: ArticleRatingRow[];
	hasMoreArticleRatings: boolean;
	nextArticleRatingsCursor: string | null;
}

export interface TableDataResponse {
	data: MetricsTableRow[];
	hasMore: boolean;
	nextCursor: number | null;
}
