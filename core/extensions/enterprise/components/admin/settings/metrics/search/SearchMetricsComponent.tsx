import { cn } from "@core-ui/utils/cn";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import SearchQueryDetailsTable from "@ext/enterprise/components/admin/settings/metrics/search/details/SearchQueryDetailsTable";
import ArticleRatingsTable from "@ext/enterprise/components/admin/settings/metrics/search/ratings/ArticleRatingsTable";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useMemo, useRef, useState } from "react";
import MetricsChart from "../components/chart/MetricsChart";
import MetricsDateFilter from "../components/filters/MetricsDateFilter";
import type { SortOrder } from "../filters";
import useMetricsFilters from "../filters";
import { searchChartConfig } from "./chart/searchMetricsConfig";
import SearchMetricsFilterDropdown from "./filters/SearchMetricsFilterDropdown";
import SearchCards from "./SearchCards";
import SearchMetricsTable from "./table/SearchMetricsTable";
import type { SearchMetricsTableRow } from "./table/SearchMetricsTableConfig";

const TABLES_HEIGHT = 420;

const SearchMetricsComponent = () => {
	const {
		settings,
		ensureLoaded,
		getSearchTableData,
		getTabError,
		isInitialLoading,
		healthcheckDataProvider,
		isRefreshing,
		getSearchMetricsCatalogs,
	} = useSettings();
	const { filters, setFilters } = useMetricsFilters("search");
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});
	const searchMetricsSettings = settings?.searchMetrics;

	const [userSelectedQuery, setUserSelectedQuery] = useState<string | null>(null);
	const selectedQuery = userSelectedQuery ?? searchMetricsSettings?.tableData?.[0]?.normalizedQuery ?? null;

	const queryDetailsRef = useRef<HTMLDivElement>(null);
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
			await ensureLoaded("searchMetrics");
		},
		[setFilters, ensureLoaded],
	);

	const isContentUnavailable = isInitialLoading("metrics") || Boolean(tabError) || Boolean(healthCheckLoader);

	useAdminHeader({
		title: (
			<div className="flex gap-2">
				{getAdminPageTitle(Page.SEARCH_METRICS)}
				{isHealthy === false && (
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
						<TooltipContent className="font-sans font-normal">
							{t("enterprise.admin.errors.database-unavailable")}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		),
		actions: isContentUnavailable ? undefined : (
			<div className={cn("flex items-center gap-2", !isHealthy && "opacity-50 pointer-events-none")}>
				<SearchMetricsFilterDropdown
					disabled={isRefreshing("metrics")}
					getMetricsCatalogs={getSearchMetricsCatalogs}
					onCatalogChange={(catalogs) => handleFilterChange({ selectedCatalogs: catalogs })}
					selectedCatalogs={filters.selectedCatalogs ?? []}
				/>
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
		),
	});

	if (isInitialLoading("metrics")) return <TabInitialLoader />;

	if (tabError) return <TabErrorBlock code={tabError} onRetry={() => ensureLoaded("searchMetrics")} />;

	if (healthCheckLoader) return healthCheckLoader;

	return (
		<div>
			<div
				className={`flex flex-col flex-1 min-h-0 gap-8 overflow-auto ${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}
			>
				<div className="flex gap-8" style={{ minHeight: 440 }}>
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
							endDate={filters.endDate}
							getSearchTableData={stableGetSearchTableData}
							initialData={initialData}
							onRowClick={handleTableRowClick}
							onSortChange={createTableSortHandler}
							selectedCatalogs={filters.selectedCatalogs}
							selectedQuery={selectedQuery}
							sortBy={filters.queriesTable.sortBy}
							sortOrder={filters.queriesTable.sortOrder}
							startDate={filters.startDate}
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
							selectedCatalogs={filters.selectedCatalogs}
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
