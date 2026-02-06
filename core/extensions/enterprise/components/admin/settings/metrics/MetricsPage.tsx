import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useEffect, useState } from "react";

const MetricsPage = () => {
	const { settings, updateMetrics, ensureMetricsLoaded, getTabError, isInitialLoading, healthcheckDataProvider } =
		useSettings();
	const metricsEnabled = settings?.metrics?.enabled ?? false;
	const [localMetricsEnabled, setLocalMetricsEnabled] = useState(metricsEnabled);
	const [isSaving, setIsSaving] = useState(false);
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});

	useEffect(() => {
		setLocalMetricsEnabled(metricsEnabled);
	}, [metricsEnabled]);

	const tabError = getTabError("metrics");

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
	if (healthCheckLoader) return healthCheckLoader;
	return (
		<div className="flex flex-col h-full" style={{ height: "inherit" }}>
			<StickyHeader
				actions={
					<SwitchField
						alignment="right"
						checked={localMetricsEnabled}
						className="gap-2"
						disabled={isSaving}
						label={localMetricsEnabled ? t("metrics.enabled") : t("metrics.disabled")}
						onCheckedChange={handleToggle}
					/>
				}
				title={
					<div>
						<div className="flex gap-2">
							{getAdminPageTitle(Page.METRICS)}
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
									<TooltipContent>{t("enterprise.admin.error.database-unavailable")}</TooltipContent>
								</Tooltip>
							)}
						</div>
					</div>
				}
			/>
			{!localMetricsEnabled && (
				<div className="flex items-center justify-center h-full px-6">
					<p className="text-muted">Metrics are disabled. Enable them using the toggle above.</p>
				</div>
			)}
		</div>
	);
};

export default MetricsPage;
