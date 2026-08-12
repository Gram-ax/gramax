import { loadMetricsFilters } from "@ext/enterprise/components/admin/settings/metrics/filters";
import { PAGE_SIZE } from "@ext/enterprise/components/admin/settings/metrics/utils";
import type EnterpriseService from "@ext/enterprise/EnterpriseService";
import { type GesErrorCode, toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { type LoadableTab, type Settings, type TabKey, tabKeys } from "@ext/enterprise/types/EnterpriseAdmin";
import { setStateObjectValue } from "@ext/enterprise/utils/setStateObjectValue";
import { type Dispatch, type SetStateAction, useCallback, useMemo, useRef, useState } from "react";

interface UseConfigLoadersArgs {
	settings: Partial<Settings>;
	enterpriseService: EnterpriseService;
	token: string;
	setInitialLoading: Dispatch<SetStateAction<Record<TabKey, boolean>>>;
	setRefreshing: Dispatch<SetStateAction<Record<TabKey, boolean>>>;
	setTabErrors: Dispatch<SetStateAction<Record<TabKey, GesErrorCode | null>>>;
	setSettings: Dispatch<SetStateAction<Partial<Settings>>>;
}

export const useConfigLoaders = (args: UseConfigLoadersArgs) => {
	const { settings, enterpriseService, token, setInitialLoading, setRefreshing, setTabErrors, setSettings } = args;
	const [etags, setEtags] = useState<Partial<Record<TabKey, string>>>({});
	const setEtag = useCallback(
		(tab: TabKey, etag: string | null) => etag && setStateObjectValue(setEtags, tab, etag),
		[],
	);

	const settingsRef = useRef(settings);
	settingsRef.current = settings;
	const etagsRef = useRef(etags);
	etagsRef.current = etags;

	const withLoad = useCallback(
		async <T>(tab: TabKey, hasData: boolean, fetcher: () => Promise<T>) => {
			if (!hasData) setStateObjectValue(setInitialLoading, tab, true);
			else setStateObjectValue(setRefreshing, tab, true);
			try {
				setStateObjectValue(setTabErrors, tab, null);
				const res = await fetcher();
				return res;
			} catch (e) {
				setStateObjectValue(setTabErrors, tab, toGesErrorCode(e));
				return undefined;
			} finally {
				if (!hasData) setStateObjectValue(setInitialLoading, tab, false);
				else setStateObjectValue(setRefreshing, tab, false);
			}
		},
		[setInitialLoading, setRefreshing, setTabErrors],
	);

	const makeEnsureLoaded = useCallback(
		(tab: TabKey) =>
			async (force = false) => {
				await withLoad(tab, Boolean(settingsRef.current?.[tab]), async () => {
					const { data, etag, notModified } = await enterpriseService.getConfig(
						tab,
						token,
						force ? undefined : etagsRef.current[tab],
					);
					if (!notModified && data) setStateObjectValue(setSettings, tab, data as Settings[typeof tab]);
					setEtag(tab, etag);
					return true as const;
				});
			},
		[enterpriseService, token, setEtag, setSettings, withLoad],
	);

	const simpleLoaders = useMemo(
		() =>
			Object.fromEntries(tabKeys.map((x) => [x, makeEnsureLoaded(x)])) as Record<
				TabKey,
				(force?: boolean) => Promise<void>
			>,
		[makeEnsureLoaded],
	);

	const ensureMetricsLoaded = useCallback(async () => {
		const filters = loadMetricsFilters();
		const {
			interval,
			startDate,
			endDate,
			selectedUserEmails,
			sortBy,
			sortOrder,
			anonymousFilter,
			selectedCatalogs,
		} = filters.view;
		await withLoad("metrics", Boolean(settingsRef.current?.metrics), async () => {
			const [chartData, tableData, metricsConfigResult] = await Promise.all([
				enterpriseService.getMetricsChartData(
					token,
					startDate,
					endDate,
					undefined,
					selectedUserEmails,
					anonymousFilter,
					selectedCatalogs,
				),
				enterpriseService.getMetricsTableData(
					token,
					startDate,
					endDate,
					PAGE_SIZE,
					undefined,
					sortBy,
					sortOrder,
					selectedUserEmails,
					anonymousFilter,
					selectedCatalogs,
				),
				enterpriseService.getConfig("metrics", token, etagsRef.current.metrics),
			]);

			const metricsConfigEnabled = metricsConfigResult.data?.enabled ?? false;
			setEtag("metrics", metricsConfigResult.etag);

			if (chartData && tableData) {
				setStateObjectValue(setSettings, "metrics", {
					chartData,
					tableData: tableData.data,
					hasMore: tableData.hasMore,
					nextCursor: tableData.nextCursor,
					interval,
					enabled: metricsConfigEnabled,
				});
			} else {
				setStateObjectValue(setSettings, "metrics", {
					...settingsRef.current?.metrics,
					enabled: metricsConfigEnabled,
				} as Settings["metrics"]);
			}
			return true as const;
		});
	}, [enterpriseService, token, setEtag, setSettings, withLoad]);

	const ensureSearchMetricsLoaded = useCallback(async () => {
		const filters = loadMetricsFilters();
		const {
			interval,
			startDate,
			endDate,
			queriesTable,
			queriesDetailsTable,
			articleRatingTable,
			selectedCatalogs,
		} = filters.search;
		const { sortBy, sortOrder } = queriesTable;
		const catalogFilter = selectedCatalogs?.length ? selectedCatalogs : undefined;
		await withLoad("metrics", Boolean(settingsRef.current?.searchMetrics), async () => {
			const [chartData, tableData, articleRatingsData] = await Promise.all([
				enterpriseService.getSearchMetricsChartData(token, startDate, endDate, catalogFilter),
				enterpriseService.getSearchMetricsTableData(
					token,
					startDate,
					endDate,
					undefined,
					sortBy,
					sortOrder,
					25,
					catalogFilter,
				),
				enterpriseService.getArticleRatings(
					token,
					startDate,
					endDate,
					undefined,
					articleRatingTable.sortBy,
					articleRatingTable.sortOrder,
					undefined,
					catalogFilter,
				),
			]);

			const firstQuery = tableData?.data?.[0]?.normalizedQuery ?? null;
			let queryDetailsData = null;

			if (firstQuery) {
				queryDetailsData = await enterpriseService.getSearchQueryDetails(
					token,
					firstQuery,
					startDate,
					endDate,
					undefined,
					queriesDetailsTable.sortBy,
					queriesDetailsTable.sortOrder,
				);
			}
			if (chartData && tableData) {
				setStateObjectValue(setSettings, "searchMetrics", {
					chartData,
					tableData: tableData.data,
					hasMoreTableData: tableData.hasMore,
					nextTableCursor: tableData.nextCursor,
					interval,
					queryDetailsData: queryDetailsData?.data ?? [],
					hasMoreQueryDetails: queryDetailsData?.hasMore ?? false,
					nextQueryDetailsCursor: queryDetailsData?.nextCursor ?? null,
					selectedQuery: firstQuery,
					articleRatingsData: articleRatingsData?.data ?? [],
					hasMoreArticleRatings: articleRatingsData?.hasMore ?? false,
					nextArticleRatingsCursor: articleRatingsData?.nextCursor ?? null,
				});
			}
			return true as const;
		});
	}, [enterpriseService, token, setSettings, withLoad]);

	const ensureLoaded = useCallback(
		(tab: LoadableTab, force?: boolean): Promise<void> => {
			if (tab === "metrics") return ensureMetricsLoaded();
			if (tab === "searchMetrics") return ensureSearchMetricsLoaded();
			return simpleLoaders[tab](force);
		},
		[ensureMetricsLoaded, ensureSearchMetricsLoaded, simpleLoaders],
	);

	return {
		ensureLoaded,
	};
};
