import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useScrollShadow } from "@ext/enterprise/components/admin/hooks/useScrollShadow";
import { useHealthCheck } from "@ext/enterprise/components/admin/settings/HealthCheck";
import { QuizTestsTable } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTestsTable";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Loader } from "ics-ui-kit/components/loader";
import { useEffect, useState } from "react";

export interface QuizSettings {
	enabled: boolean;
}

const QuizComponent = () => {
	const {
		settings,
		updateQuiz,
		ensureQuizLoaded,
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
	const [saveError, setSaveError] = useState<string>(null);
	const { isScrolled } = useScrollShadow();

	useEffect(() => {
		setLocalSettings(settings?.quiz || { enabled: false });
	}, [settings?.quiz]);

	if (isInitialLoading("quiz")) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader style={{ transform: "scale(3)" }} />
			</div>
		);
	}

	const tabError = getTabError("quiz");
	if (tabError) return <TabErrorBlock message={tabError.message} onRetry={() => ensureQuizLoaded(true)} />;

	if (healthCheckLoader) return healthCheckLoader;

	const handleSave = async (enabled: boolean) => {
		setIsSaving(true);
		try {
			await updateQuiz({ enabled });
		} catch (e) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<div className="flex flex-col h-full space-y-6" style={{ height: "inherit" }}>
				<StickyHeader
					actions={
						<SwitchField
							alignment="right"
							checked={localSettings.enabled}
							className="gap-2"
							disabled={isSaving || isHealthy === false}
							label={
								localSettings.enabled
									? t("enterprise.admin.quiz.switch.on")
									: t("enterprise.admin.quiz.switch.off")
							}
							onCheckedChange={handleSave}
						/>
					}
					isScrolled={isScrolled}
					title={
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
									<TooltipContent>{t("enterprise.admin.error.database-unavailable")}</TooltipContent>
								</Tooltip>
							)}
						</>
					}
				/>
				<FloatingAlert message={saveError} show={Boolean(saveError)} />

				{localSettings.enabled && (
					<div className="flex-1 min-h-0 px-6">
						<QuizTestsTable isHealthy={isHealthy} />
					</div>
				)}
			</div>
		</>
	);
};

export default QuizComponent;
