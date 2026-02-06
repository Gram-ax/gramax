import type { AxisLabelFormat } from "../components/chart/chartUtils";
import { getDateRangeForInterval, isPresetInterval, type MetricsInterval } from "../utils";
import { getDefaultStorage, STORAGE_KEY } from "./constants";
import type {
	AnonymousFilter,
	MetricsFiltersStorage,
	SearchMetricsFilters,
	SearchSortByColumn,
	SortByColumn,
	SortOrder,
	ViewMetricsFilters,
	VisibleSearchMetrics,
	VisibleViewMetrics,
} from "./types";

/**
 * Migrates old flat localStorage structure to new nested structure.
 * Old structure had all fields at root level: {interval, startDate, endDate, ...}
 * New structure has nested view and search: {view: {...}, search: {...}}
 *
 * Also migrates from old search structure with flat sortBy/sortOrder/axisLabelFormat/visibleMetrics
 * to new nested structure with chart/queriesTable/queriesDetailsTable/articleRatingTable
 */
export const migrateOldStructure = (parsed: Record<string, unknown>): MetricsFiltersStorage => {
	const defaults = getDefaultStorage();
	const interval = parsed.interval as MetricsInterval | undefined;

	let startDate = typeof parsed.startDate === "string" ? parsed.startDate : undefined;
	let endDate = typeof parsed.endDate === "string" ? parsed.endDate : undefined;

	// Recalculate dates if using preset interval
	if (interval && isPresetInterval(interval)) {
		const recalculated = getDateRangeForInterval(interval);
		startDate = recalculated.startDate;
		endDate = recalculated.endDate;
	}

	const migratedView: ViewMetricsFilters = {
		interval: interval ?? defaults.view.interval,
		startDate: startDate ?? defaults.view.startDate,
		endDate: endDate ?? defaults.view.endDate,
		visibleMetrics: {
			...defaults.view.visibleMetrics,
			...(parsed.visibleMetrics as Partial<VisibleViewMetrics> | undefined),
		},
		sortBy: (parsed.sortBy as SortByColumn | undefined) ?? defaults.view.sortBy,
		sortOrder: (parsed.sortOrder as SortOrder | undefined) ?? defaults.view.sortOrder,
		selectedUserEmails: (parsed.selectedUserEmails as string[] | undefined) ?? defaults.view.selectedUserEmails,
		anonymousFilter: (parsed.anonymousFilter as AnonymousFilter | undefined) ?? defaults.view.anonymousFilter,
		axisLabelFormat: (parsed.axisLabelFormat as AxisLabelFormat | undefined) ?? defaults.view.axisLabelFormat,
	};

	// Check if we're migrating from the intermediate nested structure (before chart/table split)
	const searchData = parsed.search as Record<string, unknown> | undefined;

	let migratedSearch: SearchMetricsFilters;

	if (searchData && typeof searchData === "object") {
		// Migrating from intermediate structure: search.{interval, startDate, endDate, sortBy, sortOrder, visibleMetrics, axisLabelFormat}
		let searchStartDate = searchData.startDate as string | undefined;
		let searchEndDate = searchData.endDate as string | undefined;
		const searchInterval = searchData.interval as MetricsInterval | undefined;

		if (searchInterval && isPresetInterval(searchInterval)) {
			const recalculated = getDateRangeForInterval(searchInterval);
			searchStartDate = recalculated.startDate;
			searchEndDate = recalculated.endDate;
		}

		migratedSearch = {
			interval: searchInterval ?? defaults.search.interval,
			startDate: searchStartDate ?? defaults.search.startDate,
			endDate: searchEndDate ?? defaults.search.endDate,
			chart: {
				visibleMetrics: {
					...defaults.search.chart.visibleMetrics,
					...(searchData.visibleMetrics as Partial<VisibleSearchMetrics> | undefined),
				},
				axisLabelFormat:
					(searchData.axisLabelFormat as AxisLabelFormat) ?? defaults.search.chart.axisLabelFormat,
			},
			queriesTable: {
				sortBy: (searchData.sortBy as SearchSortByColumn) ?? defaults.search.queriesTable.sortBy,
				sortOrder: (searchData.sortOrder as SortOrder) ?? defaults.search.queriesTable.sortOrder,
			},
			queriesDetailsTable: defaults.search.queriesDetailsTable,
			articleRatingTable: defaults.search.articleRatingTable,
		};
	} else {
		// Migrating from very old flat structure (no search section at all)
		migratedSearch = {
			interval: interval ?? defaults.search.interval,
			startDate: startDate ?? defaults.search.startDate,
			endDate: endDate ?? defaults.search.endDate,
			chart: {
				visibleMetrics: {
					...defaults.search.chart.visibleMetrics,
					...(parsed.visibleSearchMetrics as Partial<VisibleSearchMetrics> | undefined),
				},
				axisLabelFormat:
					(parsed.searchAxisLabelFormat as AxisLabelFormat) ?? defaults.search.chart.axisLabelFormat,
			},
			queriesTable: defaults.search.queriesTable,
			queriesDetailsTable: defaults.search.queriesDetailsTable,
			articleRatingTable: defaults.search.articleRatingTable,
		};
	}

	const migrated: MetricsFiltersStorage = {
		view: migratedView,
		search: migratedSearch,
	};

	// Save migrated structure back to localStorage
	localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));

	return migrated;
};
