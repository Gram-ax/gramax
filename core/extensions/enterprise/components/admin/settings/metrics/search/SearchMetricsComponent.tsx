import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useScrollShadow } from "@ext/enterprise/components/admin/hooks";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import SearchQueryDetailsTable from "@ext/enterprise/components/admin/settings/metrics/search/details/SearchQueryDetailsTable";
import ArticleRatingsTable from "@ext/enterprise/components/admin/settings/metrics/search/ratings/ArticleRatingsTable";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Loader } from "ics-ui-kit/components/loader";
import { useCallback, useMemo, useRef, useState } from "react";
import MetricsChart from "../components/chart/MetricsChart";
import MetricsDateFilter from "../components/filters/MetricsDateFilter";
import type { SortOrder } from "../filters";
import useMetricsFilters from "../filters";
import { searchChartConfig } from "./chart/searchMetricsConfig";
import SearchCards from "./SearchCards";
import SearchMetricsTable from "./table/SearchMetricsTable";
import type { SearchMetricsTableRow } from "./table/SearchMetricsTableConfig";

const TABLES_HEIGHT = 420;

const SearchMetricsComponent = () => {
	const {
		settings,
		ensureSearchMetricsLoaded,
		getSearchTableData,
		getTabError,
		isInitialLoading,
		healthcheckDataProvider,
		isRefreshing,
	} = useSettings();
	const { filters, setFilters } = useMetricsFilters("search");
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});
	const searchMetricsSettings = settings?.searchMetrics;

	const [userSelectedQuery, setUserSelectedQuery] = useState<string | null>(null);
	const selectedQuery = userSelectedQuery ?? searchMetricsSettings?.tableData?.[0]?.normalizedQuery ?? null;

	const queryDetailsRef = useRef<HTMLDivElement>(null);
	const { isScrolled } = useScrollShadow();
	const getSearchTableDataRef = useRef(getSearchTableData);
	getSearchTableDataRef.current = getSearchTableData;

	const stableGetSearchTableData = useCallback(
		(cursor?: string, sortBy?: string, sortOrder?: string) =>
			getSearchTableDataRef.current(cursor, sortBy, sortOrder),
		[],
	);

	const tabError = getTabError("metrics");

	const handleTableRowClick = useCallback((row: SearchMetricsTableRow) => {
		setUserSelectedQuery(row.normalizedQuery);
	}, []);

	const createTableSortHandler: (
		tableKey: "queriesTable" | "queriesDetailsTable" | "articleRatingTable",
	) => (sortBy: string, sortOrder: SortOrder) => void = useCallback(
		(tableKey: "queriesTable" | "queriesDetailsTable" | "articleRatingTable") => {
			return (newSortBy: string, newSortOrder: SortOrder) => {
				setFilters({ [tableKey]: { ...filters[tableKey], sortBy: newSortBy, sortOrder: newSortOrder } });
			};
		},
		[setFilters, filters],
	);

	const initialData = useMemo(
		() => ({
			rows: searchMetricsSettings?.tableData ?? [],
			cursor: searchMetricsSettings?.nextTableCursor ?? null,
			hasMore: searchMetricsSettings?.hasMoreTableData ?? true,
		}),
		[
			searchMetricsSettings?.tableData,
			searchMetricsSettings?.nextTableCursor,
			searchMetricsSettings?.hasMoreTableData,
		],
	);

	const handleFilterChange = useCallback(
		async (filterUpdate: Parameters<typeof setFilters>[0]) => {
			setFilters(filterUpdate);
			await ensureSearchMetricsLoaded();
		},
		[setFilters, ensureSearchMetricsLoaded],
	);

	if (isInitialLoading("metrics")) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader style={{ transform: "scale(3)" }} />
			</div>
		);
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureSearchMetricsLoaded()} />;
	}

	if (healthCheckLoader) return healthCheckLoader;

	return (
		<div>
			<StickyHeader
				actions={
					<div className={`${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}>
						<MetricsDateFilter
							dateRange={{
								startDate: filters.startDate,
								endDate: filters.endDate,
							}}
							disabled={isRefreshing("metrics")}
							interval={filters.interval}
							onChange={(newInterval, startDate, endDate) =>
								handleFilterChange({ interval: newInterval, startDate, endDate })
							}
						/>
					</div>
				}
				isScrolled={isScrolled}
				title={
					<div>
						<div className="flex gap-2">
							{getAdminPageTitle(Page.SEARCH_METRICS)}
							{!isHealthy && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="p-0 h-auto"
											size="sm"
											startIcon="circle-alert"
											status="error"
											variant="text"
										/>
									</TooltipTrigger>
									<TooltipContent>{t("enterprise.admin.error.database-unavailable")}</TooltipContent>
								</Tooltip>
							)}
						</div>
					</div>
				}
			/>
			<div
				className={`flex flex-col flex-1 min-h-0 px-6 pb-6 gap-6 overflow-auto ${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}
			>
				<div className="flex gap-6">
					<div className="flex-1 min-w-0">
						<MetricsChart
							axisLabelFormat={filters.chart.axisLabelFormat}
							config={searchChartConfig}
							data={searchMetricsSettings?.chartData ?? []}
							onAxisLabelFormatChange={(format) => {
								setFilters({ chart: { ...filters.chart, axisLabelFormat: format } });
							}}
							onVisibleFieldsChange={(updated) => {
								setFilters({ chart: { ...filters.chart, visibleMetrics: updated } });
							}}
							showFilters={true}
							title={t("metrics.searchChart.title")}
							visibleFields={filters.chart.visibleMetrics}
						/>
					</div>
					<SearchCards data={searchMetricsSettings?.chartData ?? []} />
				</div>
				<div className="flex flex-col" style={{ height: TABLES_HEIGHT }}>
					<div className="overflow-x-auto flex-1 min-h-0">
						<SearchMetricsTable
							getSearchTableData={stableGetSearchTableData}
							initialData={initialData}
							onRowClick={handleTableRowClick}
							onSortChange={createTableSortHandler}
							selectedQuery={selectedQuery}
							sortBy={filters.queriesTable.sortBy}
							sortOrder={filters.queriesTable.sortOrder}
							tableKey="queriesTable"
						/>
					</div>
				</div>
				<div className="flex gap-6" style={{ height: TABLES_HEIGHT }}>
					<div className="flex flex-col flex-1 min-w-0">
						<SearchQueryDetailsTable
							endDate={filters.endDate}
							onSortChange={createTableSortHandler}
							selectedQuery={selectedQuery}
							sortBy={filters.queriesDetailsTable.sortBy}
							sortOrder={filters.queriesDetailsTable.sortOrder}
							startDate={filters.startDate}
							tableKey="queriesDetailsTable"
						/>
					</div>
					<div className="flex flex-col flex-1 min-w-0" ref={queryDetailsRef}>
						<ArticleRatingsTable
							endDate={filters.endDate}
							onSortChange={createTableSortHandler}
							sortBy={filters.articleRatingTable.sortBy}
							sortOrder={filters.articleRatingTable.sortOrder}
							startDate={filters.startDate}
							tableKey="articleRatingTable"
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SearchMetricsComponent;
