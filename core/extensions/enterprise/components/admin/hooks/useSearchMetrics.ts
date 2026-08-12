import { type AnonymousFilter, loadMetricsFilters } from "@ext/enterprise/components/admin/settings/metrics/filters";
import type { ArticleRatingsResponse } from "@ext/enterprise/components/admin/settings/metrics/search/ratings/ArticleRatingsTableConfig";
import type { SearchTableDataResponse } from "@ext/enterprise/components/admin/settings/metrics/search/table/SearchMetricsTableConfig";
import type {
	ChartDataPoint,
	MetricsCatalogsResponse,
	MetricsUsersResponse,
	SearchQueryDetailsResponse,
	TableDataResponse,
} from "@ext/enterprise/components/admin/settings/metrics/types";
import { getDateRangeForInterval, PAGE_SIZE } from "@ext/enterprise/components/admin/settings/metrics/utils";
import type EnterpriseService from "@ext/enterprise/EnterpriseService";
import { type GesErrorCode, toGesErrorCode } from "@ext/enterprise/errors/GesError";
import type { Settings, TabKey } from "@ext/enterprise/types/EnterpriseAdmin";
import { setStateObjectValue } from "@ext/enterprise/utils/setStateObjectValue";
import { type Dispatch, type SetStateAction, useCallback } from "react";

interface UseSearchMetricsArgs {
	settings: Partial<Settings>;
	enterpriseService: EnterpriseService;
	token: string;
	setRefreshing: Dispatch<SetStateAction<Record<TabKey, boolean>>>;
	setTabErrors: Dispatch<SetStateAction<Record<TabKey, GesErrorCode | null>>>;
}

export const useSearchMetrics = (args: UseSearchMetricsArgs) => {
	const { settings, enterpriseService, token, setRefreshing, setTabErrors } = args;

	const loadFilteredChartData = async (
		startDate: string,
		endDate: string,
		articleIds?: number[],
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
		catalogFilter?: string[],
	): Promise<ChartDataPoint[] | null> => {
		setStateObjectValue(setRefreshing, "metrics", true);
		try {
			const chartData = await enterpriseService.getMetricsChartData(
				token,
				startDate,
				endDate,
				articleIds,
				userEmails,
				anonymousFilter,
				catalogFilter,
			);
			return chartData;
		} catch (e) {
			setStateObjectValue(setTabErrors, "metrics", toGesErrorCode(e));
			return null;
		} finally {
			setStateObjectValue(setRefreshing, "metrics", false);
		}
	};

	const getMetricsTableData = async (
		cursor?: number,
		startDate?: string,
		endDate?: string,
		sortBy?: string,
		sortOrder?: string,
		userEmails?: string[],
		anonymousFilter?: AnonymousFilter,
		catalogFilter?: string[],
	): Promise<TableDataResponse | null> => {
		const effectiveInterval = settings?.metrics?.interval || "month";
		const dates =
			startDate && endDate
				? { startDate, endDate }
				: getDateRangeForInterval(effectiveInterval === "custom" ? "month" : effectiveInterval);
		return orNull(() =>
			enterpriseService.getMetricsTableData(
				token,
				dates.startDate,
				dates.endDate,
				PAGE_SIZE,
				cursor,
				sortBy,
				sortOrder,
				userEmails,
				anonymousFilter,
				catalogFilter,
			),
		);
	};

	const getMetricsUsers = useCallback(
		async (search?: string, limit?: number, cursor?: number): Promise<MetricsUsersResponse | null> => {
			return orNull(() => enterpriseService.getMetricsUsers(token, search, limit, cursor));
		},
		[enterpriseService, token],
	);

	const getMetricsCatalogs = useCallback(
		async (search?: string, limit?: number, cursor?: number): Promise<MetricsCatalogsResponse | null> => {
			return orNull(() => enterpriseService.getMetricsCatalogs(token, search, limit, cursor));
		},
		[enterpriseService, token],
	);

	const getSearchMetricsCatalogs = useCallback(
		async (search?: string, limit?: number, cursor?: number): Promise<MetricsCatalogsResponse | null> => {
			return orNull(() => enterpriseService.getSearchMetricsCatalogs(token, search, limit, cursor));
		},
		[enterpriseService, token],
	);

	const getSearchTableData = async (
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	): Promise<SearchTableDataResponse | null> => {
		const filters = loadMetricsFilters();
		const searchFilters = filters.search;
		const dates =
			searchFilters.interval === "custom"
				? { startDate: searchFilters.startDate, endDate: searchFilters.endDate }
				: getDateRangeForInterval(searchFilters.interval);
		const catalogFilter = searchFilters.selectedCatalogs?.length ? searchFilters.selectedCatalogs : undefined;

		setStateObjectValue(setRefreshing, "metrics", true);
		try {
			const response = await enterpriseService.getSearchMetricsTableData(
				token,
				dates.startDate,
				dates.endDate,
				cursor,
				sortBy,
				sortOrder,
				limit ?? 25,
				catalogFilter,
			);

			if (!response) {
				return null;
			}

			return response;
		} catch (e) {
			setStateObjectValue(setTabErrors, "metrics", toGesErrorCode(e));
			return null;
		} finally {
			setStateObjectValue(setRefreshing, "metrics", false);
		}
	};

	const getSearchQueryDetails = async (
		query: string,
		startDate: string,
		endDate: string,
		cursor?: number,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
	): Promise<SearchQueryDetailsResponse | null> => {
		return orNull(() =>
			enterpriseService.getSearchQueryDetails(token, query, startDate, endDate, cursor, sortBy, sortOrder, limit),
		);
	};

	const getArticleRatings = async (
		startDate: string,
		endDate: string,
		cursor?: string,
		sortBy?: string,
		sortOrder?: string,
		limit?: number,
		catalogFilter?: string[],
	): Promise<ArticleRatingsResponse | null> => {
		return orNull(() =>
			enterpriseService.getArticleRatings(
				token,
				startDate,
				endDate,
				cursor,
				sortBy,
				sortOrder,
				limit,
				catalogFilter,
			),
		);
	};

	return {
		getMetricsTableData,
		loadFilteredChartData,
		getSearchTableData,
		getSearchQueryDetails,
		getArticleRatings,
		getMetricsUsers,
		getMetricsCatalogs,
		getSearchMetricsCatalogs,
	};
};

const orNull = async <T>(load: () => Promise<T>): Promise<T | null> => {
	try {
		return await load();
	} catch {
		return null;
	}
};
