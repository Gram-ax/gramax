import { useCallback, useState } from "react";
import { getDateRangeForInterval, isPresetInterval, MetricsInterval } from "./utils";

export type VisibleMetrics = {
	views: boolean;
	visits: boolean;
	visitors: boolean;
};

export const DEFAULT_VISIBLE_COLUMNS = {
	catalog: true,
	parentArticle: true,
	article: true,
	visitors: true,
	visits: true,
	pageviews: true,
} as const;

export type VisibleColumns = { [K in keyof typeof DEFAULT_VISIBLE_COLUMNS]: boolean };

export type SortByColumn = "pageviews" | "visitors" | "visits" | "parent_article" | "article" | "catalog";
export type SortOrder = "asc" | "desc";
export type AnonymousFilter = "all" | "registered" | "anonymous";

export interface MetricsFilters {
	interval: MetricsInterval;
	startDate: string;
	endDate: string;
	visibleMetrics: VisibleMetrics;
	sortBy: SortByColumn;
	sortOrder: SortOrder;
	selectedUserEmails: string[];
	anonymousFilter: AnonymousFilter;
	axisLabelFormat: "daily" | "weekly" | "monthly";
}

const STORAGE_KEY = "metrics-filters";

const DEFAULT_VISIBLE_METRICS: VisibleMetrics = {
	views: true,
	visits: true,
	visitors: true,
};

const DEFAULT_SORT_BY: SortByColumn = "pageviews";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

const getDefaultFilters = (): MetricsFilters => {
	const interval = "month";
	const { startDate, endDate } = getDateRangeForInterval(interval);

	return {
		interval,
		startDate,
		endDate,
		visibleMetrics: DEFAULT_VISIBLE_METRICS,
		sortBy: DEFAULT_SORT_BY,
		sortOrder: DEFAULT_SORT_ORDER,
		selectedUserEmails: [],
		anonymousFilter: "all" as AnonymousFilter,
		axisLabelFormat: "daily",
	};
};

export const loadMetricsFilters = (): MetricsFilters => {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return getDefaultFilters();
	const parsed = JSON.parse(stored) as Partial<MetricsFilters>;
	const defaults = getDefaultFilters();

	let startDate = parsed.startDate;
	let endDate = parsed.endDate;

	if (parsed.interval && isPresetInterval(parsed.interval)) {
		const recalculated = getDateRangeForInterval(parsed.interval);
		startDate = recalculated.startDate;
		endDate = recalculated.endDate;
	}

	return {
		interval: parsed.interval ?? defaults.interval,
		startDate: startDate ?? defaults.startDate,
		endDate: endDate ?? defaults.endDate,
		visibleMetrics: { ...defaults.visibleMetrics, ...parsed.visibleMetrics },
		sortBy: defaults.sortBy,
		sortOrder: defaults.sortOrder,
		selectedUserEmails: parsed.selectedUserEmails ?? defaults.selectedUserEmails,
		anonymousFilter: parsed.anonymousFilter ?? defaults.anonymousFilter,
		axisLabelFormat: parsed.axisLabelFormat ?? defaults.axisLabelFormat,
	};
};

const saveFilters = (filters: MetricsFilters): void => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
};

export const useMetricsFilters = () => {
	const [filters, setFiltersState] = useState<MetricsFilters>(() => loadMetricsFilters());

	const setFilters = useCallback((updates: Partial<MetricsFilters>) => {
		setFiltersState((prev) => {
			const newFilters = { ...prev, ...updates };
			saveFilters(newFilters);
			return newFilters;
		});
	}, []);

	return { filters, setFilters };
};

export default useMetricsFilters;
