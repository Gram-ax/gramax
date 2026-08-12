import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { useAlertMessage } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import { QuizTestsTable } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTestsTable";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
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

export interface QuizSettings {
	enabled: boolean;
}

const QuizComponent = () => {
	const {
		settings,
		gesUrl,
		update,
		ensureLoaded,
		isInitialLoading,
		isRefreshing,
		getTabError,
		healthcheckDataProvider,
	} = useSettings();
	const { isHealthy, healthCheckLoader } = useHealthCheck({
		healthcheckDataProvider,
	});
	const [localSettings, setLocalSettings] = useState<QuizSettings>({ enabled: false });
	const [isSaving, setIsSaving] = useState(false);
	const saveError = useAlertMessage();

	useEffect(() => {
		setLocalSettings(settings?.quiz || { enabled: false });
	}, [settings?.quiz]);

	const handleSave = useCallback(
		async (enabled: boolean) => {
			saveError.hide();
			setIsSaving(true);
			try {
				await update("quiz", { enabled });
			} catch (e) {
				const code = toGesErrorCode(e);
				saveError.alert(getSaveErrorText(code, gesUrl), getGesErrorTitle(code), getGesErrorBadgeText(code));
			} finally {
				setIsSaving(false);
			}
		},
		[update, saveError.hide, saveError.alert, gesUrl],
	);

	const tabError = getTabError("quiz");
	const isContentUnavailable = isInitialLoading("quiz") || Boolean(tabError) || Boolean(healthCheckLoader);

	useAdminHeader({
		alert: saveError,
		title: (
			<>
				{getAdminPageTitle(Page.QUIZ)} <Spinner show={isRefreshing("quiz")} size="small" />
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
			</>
		),
		actions: isContentUnavailable ? undefined : (
			<SwitchField
				alignment="right"
				checked={localSettings.enabled}
				className="gap-2"
				disabled={isSaving || isHealthy === false}
				label={
					localSettings.enabled ? t("enterprise.admin.quiz.switch.on") : t("enterprise.admin.quiz.switch.off")
				}
				onCheckedChange={handleSave}
			/>
		),
	});

	if (isInitialLoading("quiz")) return <TabInitialLoader />;

	if (tabError) return <TabErrorBlock code={tabError} onRetry={() => ensureLoaded("quiz", true)} />;

	if (healthCheckLoader) return healthCheckLoader;

	return (
		<>
			<div className="flex flex-col h-full">
				{localSettings.enabled && (
					<div className="flex-1 min-h-0">
						<QuizTestsTable isHealthy={isHealthy} />
					</div>
				)}
			</div>
		</>
	);
};

export default QuizComponent;
