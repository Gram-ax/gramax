import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getGesErrorBadgeText, getGesErrorTitle, getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useEffect, useState } from "react";

const MetricsPage = () => {
	const { settings, gesUrl, update, ensureLoaded, getTabError, isInitialLoading, healthcheckDataProvider } =
		useSettings();
	const metricsEnabled = settings?.metrics?.enabled ?? false;
	const [localMetricsEnabled, setLocalMetricsEnabled] = useState(metricsEnabled);
	const [isSaving, setIsSaving] = useState(false);
	const saveError = useAlertMessage();
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});

	useEffect(() => {
		setLocalMetricsEnabled(metricsEnabled);
	}, [metricsEnabled]);

	const tabError = getTabError("metrics");

	const handleToggle = useCallback(
		async (enabled: boolean) => {
			setIsSaving(true);
			saveError.hide();
			try {
				await update("metrics", { enabled });
			} catch (e) {
				const code = toGesErrorCode(e);
				saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
			} finally {
				setIsSaving(false);
			}
		},
		[update, saveError.hide, saveError.alert, gesUrl],
	);

	const isContentUnavailable = isInitialLoading("metrics") || Boolean(tabError) || Boolean(healthCheckLoader);

	useAdminHeader({
		alert: saveError,
		title: (
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
						<TooltipContent className="font-sans font-normal">
							{t("enterprise.admin.errors.database-unavailable")}
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		),
		actions: isContentUnavailable ? undefined : (
			<SwitchField
				alignment="right"
				checked={localMetricsEnabled}
				className="gap-2"
				disabled={isSaving}
				label={localMetricsEnabled ? t("metrics.enabled") : t("metrics.disabled")}
				onCheckedChange={handleToggle}
			/>
		),
	});

	if (isInitialLoading("metrics")) return <TabInitialLoader />;

	if (tabError) return <TabErrorBlock code={tabError} onRetry={() => ensureLoaded("metrics")} />;

	if (healthCheckLoader) return healthCheckLoader;

	return (
		<div className="flex flex-col h-full" style={{ height: "inherit" }}>
			{!localMetricsEnabled && (
				<div className="flex items-center justify-center h-full">
					<p className="text-muted">{t("metrics.disabled-hint")}</p>
				</div>
			)}
		</div>
	);
};

export default MetricsPage;
