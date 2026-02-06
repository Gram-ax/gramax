import type { AxisLabelFormat } from "../components/chart/chartUtils";
import type { SearchMetricField } from "../search/chart/searchMetricsConfig";
import type { MetricsInterval } from "../utils";
import type { ViewMetricField } from "../view/chart/viewMetricsConfig";

export type VisibleViewMetrics = Record<ViewMetricField, boolean>;
export type VisibleSearchMetrics = Record<SearchMetricField, boolean>;

export const DEFAULT_VISIBLE_COLUMNS = {
	catalog: true,
	parentArticle: true,
	article: true,
	visitors: true,
	visits: true,
	pageviews: true,
} as const;

export type VisibleColumns = {
	[K in keyof typeof DEFAULT_VISIBLE_COLUMNS]: boolean;
};

export type SortByColumn = "pageviews" | "visitors" | "visits" | "parent_article" | "article" | "catalog";

export type SearchSortByColumn =
	| "query"
	| "searchCount"
	| "uniqueVisitors"
	| "ctrPercent"
	| "mostClickedTitle"
	| "avgClickPosition"
	| "refinementPercent";

export type SearchQueryDetailsSortByColumn =
	| "catalogName"
	| "articleTitle"
	| "isRecommended"
	| "clicks"
	| "ctr"
	| "avgPosition";

export type ArticleRatingSortByColumn =
	| "catalogName"
	| "articleTitle"
	| "searchCount"
	| "ctr"
	| "avgPosition"
	| "refinementRate";

export type SortOrder = "asc" | "desc";
export type AnonymousFilter = "all" | "registered" | "anonymous";

export interface ViewMetricsFilters {
	interval: MetricsInterval;
	startDate: string;
	endDate: string;
	visibleMetrics: VisibleViewMetrics;
	sortBy: SortByColumn;
	sortOrder: SortOrder;
	selectedUserEmails: string[];
	anonymousFilter: AnonymousFilter;
	axisLabelFormat: AxisLabelFormat;
}

export interface SearchChartSettings {
	visibleMetrics: VisibleSearchMetrics;
	axisLabelFormat: AxisLabelFormat;
}

export interface SearchTableSortSettings {
	sortBy: SearchSortByColumn;
	sortOrder: SortOrder;
}

export interface SearchQueryDetailsTableSortSettings {
	sortBy: SearchQueryDetailsSortByColumn;
	sortOrder: SortOrder;
}

export interface ArticleRatingTableSortSettings {
	sortBy: ArticleRatingSortByColumn;
	sortOrder: SortOrder;
}

export interface SearchMetricsFilters {
	interval: MetricsInterval;
	startDate: string;
	endDate: string;
	chart: SearchChartSettings;
	queriesTable: SearchTableSortSettings;
	queriesDetailsTable: SearchQueryDetailsTableSortSettings;
	articleRatingTable: ArticleRatingTableSortSettings;
}

export interface MetricsFiltersStorage {
	view: ViewMetricsFilters;
	search: SearchMetricsFilters;
}
