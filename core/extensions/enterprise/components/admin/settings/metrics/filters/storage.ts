import { getDateRangeForInterval, isPresetInterval } from "../utils";
import { getDefaultStorage, STORAGE_KEY } from "./constants";
import { migrateOldStructure } from "./migration";
import type { MetricsFiltersStorage } from "./types";

export const loadMetricsFilters = (): MetricsFiltersStorage => {
	const stored = localStorage.getItem(STORAGE_KEY);

	if (!stored) {
		const defaults = getDefaultStorage();
		saveFilters(defaults);
		return defaults;
	}

	try {
		const parsed = JSON.parse(stored) as Record<string, unknown>;

		// Check if it's the new nested structure
		if (parsed.view && typeof parsed.view === "object" && parsed.search && typeof parsed.search === "object") {
			return loadNestedStructure(parsed);
		}

		// Migrate old flat structure to new nested structure
		return migrateOldStructure(parsed);
	} catch {
		return getDefaultStorage();
	}
};

const loadNestedStructure = (parsed: Record<string, unknown>): MetricsFiltersStorage => {
	const defaults = getDefaultStorage();
	const viewData = parsed.view as Partial<MetricsFiltersStorage["view"]>;
	const searchData = parsed.search as Partial<MetricsFiltersStorage["search"]>;

	// Recalculate dates for preset intervals
	let viewStartDate = viewData.startDate;
	let viewEndDate = viewData.endDate;
	if (viewData.interval && isPresetInterval(viewData.interval)) {
		const recalculated = getDateRangeForInterval(viewData.interval);
		viewStartDate = recalculated.startDate;
		viewEndDate = recalculated.endDate;
	}

	let searchStartDate = searchData.startDate;
	let searchEndDate = searchData.endDate;
	if (searchData.interval && isPresetInterval(searchData.interval)) {
		const recalculated = getDateRangeForInterval(searchData.interval);
		searchStartDate = recalculated.startDate;
		searchEndDate = recalculated.endDate;
	}

	const searchChart = searchData.chart as Partial<MetricsFiltersStorage["search"]["chart"]> | undefined;
	const queriesTable = searchData.queriesTable as
		| Partial<MetricsFiltersStorage["search"]["queriesTable"]>
		| undefined;
	const queriesDetailsTable = searchData.queriesDetailsTable as
		| Partial<MetricsFiltersStorage["search"]["queriesDetailsTable"]>
		| undefined;
	const articleRatingTable = searchData.articleRatingTable as
		| Partial<MetricsFiltersStorage["search"]["articleRatingTable"]>
		| undefined;

	return {
		view: {
			interval: viewData.interval ?? defaults.view.interval,
			startDate: viewStartDate ?? defaults.view.startDate,
			endDate: viewEndDate ?? defaults.view.endDate,
			visibleMetrics: {
				...defaults.view.visibleMetrics,
				...viewData.visibleMetrics,
			},
			sortBy: viewData.sortBy ?? defaults.view.sortBy,
			sortOrder: viewData.sortOrder ?? defaults.view.sortOrder,
			selectedUserEmails: viewData.selectedUserEmails ?? defaults.view.selectedUserEmails,
			anonymousFilter: viewData.anonymousFilter ?? defaults.view.anonymousFilter,
			axisLabelFormat: viewData.axisLabelFormat ?? defaults.view.axisLabelFormat,
		},
		search: {
			interval: searchData.interval ?? defaults.search.interval,
			startDate: searchStartDate ?? defaults.search.startDate,
			endDate: searchEndDate ?? defaults.search.endDate,
			chart: {
				visibleMetrics: {
					...defaults.search.chart.visibleMetrics,
					...searchChart?.visibleMetrics,
				},
				axisLabelFormat: searchChart?.axisLabelFormat ?? defaults.search.chart.axisLabelFormat,
			},
			queriesTable: {
				sortBy: queriesTable?.sortBy ?? defaults.search.queriesTable.sortBy,
				sortOrder: queriesTable?.sortOrder ?? defaults.search.queriesTable.sortOrder,
			},
			queriesDetailsTable: {
				sortBy: queriesDetailsTable?.sortBy ?? defaults.search.queriesDetailsTable.sortBy,
				sortOrder: queriesDetailsTable?.sortOrder ?? defaults.search.queriesDetailsTable.sortOrder,
			},
			articleRatingTable: {
				sortBy: articleRatingTable?.sortBy ?? defaults.search.articleRatingTable.sortBy,
				sortOrder: articleRatingTable?.sortOrder ?? defaults.search.articleRatingTable.sortOrder,
			},
		},
	};
};

export const saveFilters = (storage: MetricsFiltersStorage): void => {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
};
