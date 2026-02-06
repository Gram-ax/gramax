import { getDateRangeForInterval } from "../utils";
import type {
	ArticleRatingTableSortSettings,
	MetricsFiltersStorage,
	SearchChartSettings,
	SearchMetricsFilters,
	SearchQueryDetailsTableSortSettings,
	SearchTableSortSettings,
	SortByColumn,
	SortOrder,
	ViewMetricsFilters,
	VisibleSearchMetrics,
	VisibleViewMetrics,
} from "./types";

export const STORAGE_KEY = "metrics-filters";

const DEFAULT_VISIBLE_VIEW_METRICS: VisibleViewMetrics = {
	views: true,
	visits: true,
	visitors: true,
};

const DEFAULT_VISIBLE_SEARCH_METRICS: VisibleSearchMetrics = {
	totalSearches: true,
	avgCTR: true,
	noClickRate: true,
	refinementRate: true,
};

const DEFAULT_SORT_BY: SortByColumn = "pageviews";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

export const getDefaultViewFilters = (): ViewMetricsFilters => {
	const interval = "month";
	const { startDate, endDate } = getDateRangeForInterval(interval);

	return {
		interval,
		startDate,
		endDate,
		visibleMetrics: DEFAULT_VISIBLE_VIEW_METRICS,
		sortBy: DEFAULT_SORT_BY,
		sortOrder: DEFAULT_SORT_ORDER,
		selectedUserEmails: [],
		anonymousFilter: "all",
		axisLabelFormat: "daily",
	};
};

export const getDefaultSearchChartSettings = (): SearchChartSettings => ({
	visibleMetrics: DEFAULT_VISIBLE_SEARCH_METRICS,
	axisLabelFormat: "daily",
});

export const getDefaultQueriesTableSettings = (): SearchTableSortSettings => ({
	sortBy: "searchCount",
	sortOrder: "desc",
});

export const getDefaultQueriesDetailsTableSettings = (): SearchQueryDetailsTableSortSettings => ({
	sortBy: "clicks",
	sortOrder: "desc",
});

export const getDefaultArticleRatingTableSettings = (): ArticleRatingTableSortSettings => ({
	sortBy: "searchCount",
	sortOrder: "desc",
});

export const getDefaultSearchFilters = (): SearchMetricsFilters => {
	const interval = "month";
	const { startDate, endDate } = getDateRangeForInterval(interval);

	return {
		interval,
		startDate,
		endDate,
		chart: getDefaultSearchChartSettings(),
		queriesTable: getDefaultQueriesTableSettings(),
		queriesDetailsTable: getDefaultQueriesDetailsTableSettings(),
		articleRatingTable: getDefaultArticleRatingTableSettings(),
	};
};

export const getDefaultStorage = (): MetricsFiltersStorage => ({
	view: getDefaultViewFilters(),
	search: getDefaultSearchFilters(),
});
