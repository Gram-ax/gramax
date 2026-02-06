import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useScrollShadow } from "@ext/enterprise/components/admin/hooks";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import useMetricsFilters from "@ext/enterprise/components/admin/settings/metrics/filters";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Loader } from "ics-ui-kit/components/loader";
import { useCallback, useState } from "react";
import MetricsChart from "../components/chart/MetricsChart";
import MetricsAnonymousSelect from "../components/filters/MetricsAnonymousSelect";
import MetricsDateFilter from "../components/filters/MetricsDateFilter";
import MetricsUserFilter from "../components/filters/MetricsUserFilter";
import type { ChartDataPoint } from "../types";
import { viewMetricsChartConfig } from "./chart/viewMetricsConfig";
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
		healthcheckDataProvider,
	} = useSettings();
	const metricsSettings = settings?.metrics;
	const { filters, setFilters } = useMetricsFilters("view");
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});
	const { isScrolled } = useScrollShadow();
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
		<div className="flex flex-col h-full" style={{ height: "inherit" }}>
			<StickyHeader
				actions={
					<div className={`flex justify-between gap-2 ${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}>
						{filters.anonymousFilter !== "anonymous" && (
							<MetricsUserFilter
								disabled={isRefreshing("metrics")}
								onSearchUsers={getMetricsUsers}
								onSelectionChange={(selectedEmails) =>
									handleFilterChange({ selectedUserEmails: selectedEmails })
								}
								selectedUserEmails={filters.selectedUserEmails}
							/>
						)}
						<MetricsAnonymousSelect
							disabled={isRefreshing("metrics")}
							onChange={(anonymousFilter) => handleFilterChange({ anonymousFilter })}
							value={filters.anonymousFilter}
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
				isScrolled={isScrolled}
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
			<div
				className={`flex flex-col flex-1 min-h-0 px-6 pb-6 gap-6 overflow-auto ${!isHealthy ? "opacity-50 pointer-events-none" : ""}`}
			>
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
				<div className="flex-1" style={{ minHeight: 400 }}>
					<MetricsTable
						getMetricsTableData={(cursor, sortByParam, sortOrderParam) =>
							getMetricsTableData(
								cursor,
								filters.startDate,
								filters.endDate,
								sortByParam,
								sortOrderParam,
								filters.selectedUserEmails,
								filters.anonymousFilter,
							)
						}
						loadFilteredChartData={(articleIds) =>
							loadFilteredChartData(
								filters.startDate,
								filters.endDate,
								articleIds,
								filters.selectedUserEmails,
								filters.anonymousFilter,
							)
						}
						onFilteredChartDataChange={setChartData}
						onSortChange={(sortBy, sortOrder) => setFilters({ sortBy, sortOrder })}
						sortBy={filters.sortBy}
						sortOrder={filters.sortOrder}
					/>
				</div>
			</div>
		</div>
	);
};

export default ViewMetricsComponent;
