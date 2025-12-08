import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { useEffect, useState } from "react";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { QuizTestsTable } from "@ext/enterprise/components/admin/settings/quiz/components/QuizTestsTable";
import { SwitchField } from "@ui-kit/Switch";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Button } from "@ui-kit/Button";

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
				<div className="flex w-full justify-between items-center">
					<h1 className="flex items-center text-2xl font-bold h-[40px] gap-2">
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
								<TooltipContent>Сервис базы данных недоступен</TooltipContent>
							</Tooltip>
						)}
					</h1>
					<SwitchField
						label={
							localSettings.enabled
								? t("enterprise.admin.quiz.switch.on")
								: t("enterprise.admin.quiz.switch.off")
						}
						alignment="right"
						className="gap-2"
						disabled={isSaving}
						checked={localSettings.enabled}
						onCheckedChange={handleSave}
					/>
				</div>
				<FloatingAlert show={Boolean(saveError)} message={saveError} />

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
