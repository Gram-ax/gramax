import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import useMetricsFilters from "@ext/enterprise/components/admin/settings/metrics/filters";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Loader } from "@ui-kit/Loader";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useState } from "react";
import MetricsChart from "../components/chart/MetricsChart";
import MetricsDateFilter from "../components/filters/MetricsDateFilter";
import type { ChartDataPoint } from "../types";
import { viewMetricsChartConfig } from "./chart/viewMetricsConfig";
import ViewMetricsFilterDropdown from "./filters/ViewMetricsFilterDropdown";
import MetricsTable from "./table/MetricsTable";

const ViewMetricsComponent = () => {
	const {
		settings,
		ensureMetricsLoaded,
		getTabError,
		isInitialLoading,
		isRefreshing,
		getMetricsTableData,
		loadFilteredChartData,
		getMetricsUsers,
		getMetricsCatalogs,
		healthcheckDataProvider,
	} = useSettings();
	const metricsSettings = settings?.metrics;
	const { filters, setFilters } = useMetricsFilters("view");
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});
	const [chartData, setChartData] = useState<ChartDataPoint[] | null>(metricsSettings?.chartData);

	const tabError = getTabError("metrics");

	const handleFilterChange = useCallback(
		async (filterUpdate: Parameters<typeof setFilters>[0]) => {
			setFilters(filterUpdate);
			setChartData(null);
			await ensureMetricsLoaded();
		},
		[setFilters, ensureMetricsLoaded],
	);

	if (isInitialLoading("metrics")) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader style={{ transform: "scale(3)" }} />
			</div>
		);
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureMetricsLoaded()} />;
	}

	if (healthCheckLoader) return healthCheckLoader;

	return (
		<>
			<StickyHeader
				actions={
					<div className={`flex justify-between gap-2 ${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}>
						<ViewMetricsFilterDropdown
							anonymousFilter={filters.anonymousFilter}
							disabled={isRefreshing("metrics")}
							getMetricsCatalogs={getMetricsCatalogs}
							getMetricsUsers={getMetricsUsers}
							onAnonymousChange={(anonymousFilter) => handleFilterChange({ anonymousFilter })}
							onCatalogChange={(catalogs) => handleFilterChange({ selectedCatalogs: catalogs })}
							onUserChange={(emails) => handleFilterChange({ selectedUserEmails: emails })}
							selectedCatalogs={filters.selectedCatalogs ?? []}
							selectedUserEmails={filters.selectedUserEmails}
						/>
						<MetricsDateFilter
							dateRange={{
								startDate: filters.startDate,
								endDate: filters.endDate,
							}}
							disabled={isRefreshing("metrics")}
							interval={filters.interval}
							onChange={(newInterval, startDate, endDate) =>
								handleFilterChange({
									interval: newInterval,
									startDate,
									endDate,
								})
							}
						/>
					</div>
				}
				title={
					<div>
						<div className="flex gap-2">
							{getAdminPageTitle(Page.VIEW_METRICS)}
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
			<div className={`flex flex-col min-h-0 h-full gap-6 ${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}>
				<MetricsChart
					axisLabelFormat={filters.axisLabelFormat}
					config={viewMetricsChartConfig}
					data={chartData ?? metricsSettings?.chartData ?? []}
					onAxisLabelFormatChange={(format) => {
						setFilters({ axisLabelFormat: format });
					}}
					onVisibleFieldsChange={(updated) => {
						setFilters({ visibleMetrics: updated });
					}}
					title={t("metrics.viewChart.title")}
					visibleFields={filters.visibleMetrics}
				/>
				<div className="max-h-[400px] min-h-[400px]">
					<MetricsTable
						catalogFilter={filters.selectedCatalogs}
						getMetricsTableData={(cursor, sortByParam, sortOrderParam) =>
							getMetricsTableData(
								cursor,
								filters.startDate,
								filters.endDate,
								sortByParam,
								sortOrderParam,
								filters.selectedUserEmails,
								filters.anonymousFilter,
								filters.selectedCatalogs,
							)
						}
						loadFilteredChartData={(articleIds) =>
							loadFilteredChartData(
								filters.startDate,
								filters.endDate,
								articleIds,
								filters.selectedUserEmails,
								filters.anonymousFilter,
								filters.selectedCatalogs,
							)
						}
						onFilteredChartDataChange={setChartData}
						onSortChange={(sortBy, sortOrder) => setFilters({ sortBy, sortOrder })}
						sortBy={filters.sortBy}
						sortOrder={filters.sortOrder}
					/>
				</div>
			</div>
		</>
	);
};

export default ViewMetricsComponent;
