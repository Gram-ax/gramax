import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useScrollShadow } from "@ext/enterprise/components/admin/hooks/useScrollShadow";
import { QuizTestsTable } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTestsTable";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
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
	const [localSettings, setLocalSettings] = useState<QuizSettings>({ enabled: false });
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string>(null);
	const [isHealthy, setIsHealthy] = useState(null);
	const { isScrolled } = useScrollShadow();

	useEffect(() => {
		setLocalSettings(settings?.quiz || { enabled: false });
	}, [settings?.quiz]);

	useEffect(() => {
		void healthcheckDataProvider().then((res) => setIsHealthy(res));
	}, []);

	if (isInitialLoading("quiz")) return <TabInitialLoader />;
	const tabError = getTabError("quiz");

	if (tabError) return <TabErrorBlock message={tabError.message} onRetry={() => ensureQuizLoaded(true)} />;

	const handleSave = async (enabled: boolean) => {
		setIsSaving(true);
		try {
			await updateQuiz({ enabled });
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<div className="flex flex-col h-full space-y-6" style={{ height: "inherit" }}>
				<StickyHeader
					title={
						<>
							{getAdminPageTitle(Page.QUIZ)} <Spinner size="small" show={isRefreshing("quiz")} />
							{isHealthy === false && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											className="p-0 h-auto"
											startIcon="circle-alert"
											variant="text"
											status="error"
											size="sm"
										/>
									</TooltipTrigger>
									<TooltipContent>{t("enterprise.admin.quiz.errors.database-unavailable")}</TooltipContent>
								</Tooltip>
							)}
						</>
					}
					isScrolled={isScrolled}
					actions={
						<SwitchField
							label={
								localSettings.enabled
									? t("enterprise.admin.quiz.switch.on")
									: t("enterprise.admin.quiz.switch.off")
							}
							alignment="right"
							className="gap-2"
							disabled={isSaving || isHealthy === false}
							checked={localSettings.enabled}
							onCheckedChange={handleSave}
						/>
					}
				/>
				<FloatingAlert show={Boolean(saveError)} message={saveError} />

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
