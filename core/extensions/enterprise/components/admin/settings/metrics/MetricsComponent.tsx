import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import useMetricsFilters from "@ext/enterprise/components/admin/settings/metrics/useMetricsFilters";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { SwitchField } from "@ui-kit/Switch";
import { useCallback, useEffect, useState } from "react";
import MetricsChart from "./components/chart/MetricsChart";
import MetricsAnonymousSelect from "./components/filters/MetricsAnonymousSelect";
import MetricsDateFilter from "./components/filters/MetricsDateFilter";
import MetricsUserFilter from "./components/filters/MetricsUserFilter";
import MetricsTable from "./components/table/MetricsTable";
import type { ChartDataPoint } from "./types";
import { getDisplayText } from "./utils";

const MetricsComponent = () => {
	const {
		settings,
		updateMetrics,
		ensureMetricsLoaded,
		getTabError,
		isInitialLoading,
		isRefreshing,
		getMetricsTableData,
		loadFilteredChartData,
		getMetricsUsers,
	} = useSettings();
	const metricsSettings = settings?.metrics;
	const metricsEnabled = settings?.metrics?.enabled ?? false;
	const { filters, setFilters } = useMetricsFilters();

	const [chartData, setChartData] = useState<ChartDataPoint[] | null>(metricsSettings?.chartData);
	const [localMetricsEnabled, setLocalMetricsEnabled] = useState(metricsEnabled);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setLocalMetricsEnabled(metricsEnabled);
	}, [metricsEnabled]);

	const tabError = getTabError("metrics");

	const handleFilterChange = useCallback(
		async (filterUpdate: Parameters<typeof setFilters>[0]) => {
			setFilters(filterUpdate);
			setChartData(null);
			await ensureMetricsLoaded();
		},
		[setFilters, ensureMetricsLoaded],
	);

	const handleToggle = async (enabled: boolean) => {
		setIsSaving(true);
		try {
			await updateMetrics({ enabled });
		} finally {
			setIsSaving(false);
		}
	};

	if (isInitialLoading("metrics")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureMetricsLoaded()} />;
	}

	if (!metricsSettings?.chartData) {
		return <TabErrorBlock message={t("metrics.failed-to-load")} onRetry={() => ensureMetricsLoaded()} />;
	}

	return (
		<div className="flex flex-col h-full" style={{ height: "inherit" }}>
			<StickyHeader
				title={
					<div>
						{getAdminPageTitle(Page.METRICS)}
						{localMetricsEnabled && (
							<p className="text-muted text-sm font-thin mt-2">
								{getDisplayText(filters.startDate, filters.endDate)}
							</p>
						)}
					</div>
				}
				actions={
					<SwitchField
						label={localMetricsEnabled ? t("metrics.enabled") : t("metrics.disabled")}
						alignment="right"
						className="gap-2"
						disabled={isSaving}
						checked={localMetricsEnabled}
						onCheckedChange={handleToggle}
					/>
				}
			/>
			{localMetricsEnabled && (
				<div className="flex flex-col flex-1 min-h-0 px-6 gap-6">
					<div className="flex justify-between gap-1">
						<div className="flex gap-2">
							<MetricsAnonymousSelect
								value={filters.anonymousFilter}
								disabled={isRefreshing("metrics")}
								onChange={(anonymousFilter) => handleFilterChange({ anonymousFilter })}
							/>
							{filters.anonymousFilter !== "anonymous" && (
								<MetricsUserFilter
									disabled={isRefreshing("metrics")}
									selectedUserEmails={filters.selectedUserEmails}
									onSearchUsers={getMetricsUsers}
									onSelectionChange={(selectedEmails) =>
										handleFilterChange({ selectedUserEmails: selectedEmails })
									}
								/>
							)}
						</div>
						<MetricsDateFilter
							interval={filters.interval}
							disabled={isRefreshing("metrics")}
							dateRange={{ startDate: filters.startDate, endDate: filters.endDate }}
							onChange={(newInterval, startDate, endDate) =>
								handleFilterChange({ interval: newInterval, startDate, endDate })
							}
						/>
					</div>
					<MetricsChart
						data={chartData ?? metricsSettings?.chartData ?? []}
						visibleMetrics={filters.visibleMetrics}
						onVisibleMetricsChange={(visibleMetrics) => setFilters({ visibleMetrics })}
						axisLabelFormat={filters.axisLabelFormat}
						onAxisLabelFormatChange={(axisLabelFormat) => setFilters({ axisLabelFormat })}
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
							sortBy={filters.sortBy}
							sortOrder={filters.sortOrder}
							onSortChange={(sortBy, sortOrder) => setFilters({ sortBy, sortOrder })}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default MetricsComponent;
