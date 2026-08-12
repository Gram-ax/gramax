import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useTabGuard } from "@ext/enterprise/components/admin/hooks/useTabGuard";
import { StyleGuideRules } from "@ext/enterprise/components/admin/settings/styleGuide/components/table/StyleGuideRules";
import { useStyleGuideHeader } from "@ext/enterprise/components/admin/settings/styleGuide/components/title/useStyleGuideHeader";
import {
	StyleGuideContextProviders,
	type StyleGuideDataContextValue,
	type StyleGuideTestContextValue,
	type StyleGuideUIContextValue,
} from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import { useTestManager } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/useTestManager";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { toGesErrorCode } from "@ext/enterprise/errors/GesError";
import { getSaveErrorText } from "@ext/enterprise/errors/getGesErrorText";
import { Page } from "@ext/enterprise/types/Page";
import t from "@ext/localization/locale/translate";
import { Loader } from "@ui-kit/Loader";
import { toast } from "@ui-kit/Toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LgtRule, LlmRule } from "./types";

export type StyleGuideSettings = {
	enabled: boolean;
	lgt: { rules: LgtRule[] };
	llm?: { rules: LlmRule[] };
	systemPrompt?: { text: string };
};

const StyleGuideComponent = ({ className }: { className?: string }) => {
	const {
		settings,
		gesUrl,
		update,
		checkStyleGuide,
		ensureLoaded,
		isInitialLoading,
		isRefreshing,
		getTabError,
		healthcheckStyleGuide,
	} = useSettings();

	const checkSettings = settings?.styleGuide;
	const [localSettings, setLocalSettings] = useState<StyleGuideSettings>({
		enabled: false,
		lgt: { rules: [] },
		llm: { rules: [] },
	});

	const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [runningTests, setRunningTests] = useState<Set<string>>(new Set());
	const [isRunningAllTests, setIsRunningAllTests] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [errorToastId, setErrorToastId] = useState<string | number | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const isUiLocked = isInitialLoading("styleGuide") || isRefreshing("styleGuide") || isSaving;

	const isAnyTestRunning = runningTests.size > 0 || isRunningAllTests;

	useEffect(() => {
		if (isSaving) return;
		setLocalSettings(checkSettings || { enabled: false, lgt: { rules: [] } });
	}, [checkSettings, isSaving]);

	useEffect(() => {
		const runHealthcheck = async () => {
			try {
				const result = await healthcheckStyleGuide();
				setIsHealthy(result);
				// if (!result) {
				// 	setError(t("enterprise.admin.check.service-connection-error"));
				// }
			} catch {
				setIsHealthy(false);
				setError(t("enterprise.admin.check.service-connection-error"));
			}
		};
		void runHealthcheck();
	}, [healthcheckStyleGuide]);

	const handleRetry = useCallback(async () => {
		setError(null);
		setErrorToastId(null);

		try {
			const result = await healthcheckStyleGuide();
			setIsHealthy(result);

			// if (!result) {
			// 	setError(t("enterprise.admin.check.service-connection-error"));
			// }
		} catch (_e) {
			setIsHealthy(false);
			setError(t("enterprise.admin.check.service-connection-error"));
		}
	}, [healthcheckStyleGuide]);

	useEffect(() => {
		if (!error || errorToastId !== null) return;

		const id = toast(error, {
			status: "error",
			size: "lg",
			focus: "low",
			duration: 10000,
			primaryAction: {
				title: t("enterprise.admin.check.retry"),
				onClick: handleRetry,
			},
			onDismiss: () => {
				setError(null);
				setErrorToastId(null);
			},
		});

		setErrorToastId(id);
	}, [error, errorToastId, handleRetry]);

	const handleSave = useCallback(
		async (settingsToSave: StyleGuideSettings) => {
			setIsSaving(true);
			try {
				await update("styleGuide", settingsToSave);
				setHasUnsavedChanges(false);
			} catch (e) {
				setError(getSaveErrorText(toGesErrorCode(e), gesUrl));
			} finally {
				setIsSaving(false);
			}
		},
		[update, gesUrl],
	);

	useTabGuard({
		page: Page.STYLEGUIDE,
		hasChanges: () => {
			if (isInitialLoading("styleGuide") || !checkSettings) return false;
			return hasUnsavedChanges;
		},
		onSave: () => handleSave(localSettings),
		onDiscard: () => {
			if (checkSettings) setLocalSettings(checkSettings);
		},
	});

	const tabError = getTabError("styleGuide");
	const hasRules = localSettings.lgt.rules.length > 0 || (localSettings.llm?.rules?.length ?? 0) > 0;

	const hasValidTests = useCallback(() => {
		const lgtRules = localSettings.lgt.rules.filter((r) => r.enabled ?? true);
		const llmRules = (localSettings.llm?.rules ?? []).filter((r) => r.enabled ?? true);

		const hasLgtTests = lgtRules.some((rule) => rule.testCases?.some((tc) => tc.text?.trim()));
		const hasLlmTests = llmRules.some((rule) => rule.testCases?.some((tc) => tc.text?.trim()));

		return hasLgtTests || hasLlmTests;
	}, [localSettings]);

	const dataContextValue = useMemo<StyleGuideDataContextValue>(
		() => ({
			localSettings,
			checkSettings,
			setLocalSettings,
			handleSave,
		}),
		[localSettings, checkSettings, handleSave],
	);

	const uiContextValue = useMemo<StyleGuideUIContextValue>(
		() => ({
			hasUnsavedChanges,
			setHasUnsavedChanges,
		}),
		[hasUnsavedChanges],
	);

	const testManager = useTestManager(
		localSettings,
		setLocalSettings,
		checkStyleGuide,
		setRunningTests,
		setIsRunningAllTests,
	);

	const testContextValue = useMemo<StyleGuideTestContextValue>(
		() => ({
			runningTests,
			isRunningAllTests,
			isAnyTestRunning,
			hasValidTests,
			runSingleTest: testManager.runSingleTest,
			runAllTestsForRule: testManager.runAllTestsForRule,
			runAllTestsGlobal: testManager.runAllTestsGlobal,
			abortAllTests: testManager.abortAllTests,
		}),
		[runningTests, isRunningAllTests, isAnyTestRunning, hasValidTests, testManager],
	);

	useStyleGuideHeader({
		handleSave,
		hasRules,
		isHealthy,
		isContentUnavailable: isInitialLoading("styleGuide") || isHealthy === null || Boolean(tabError),
		isModuleEnabled: localSettings.enabled,
		isUiLocked,
		localSettings,
		setLocalSettings,
		testManager: {
			isAnyTestRunning,
			hasValidTests: hasValidTests(),
			abortAllTests: testManager.abortAllTests,
			runAllTestsGlobal: testManager.runAllTestsGlobal,
		},
	});

	if (isInitialLoading("styleGuide") || isHealthy === null) return <TabInitialLoader />;

	if (tabError) return <TabErrorBlock code={tabError} onRetry={() => ensureLoaded("styleGuide", true)} />;

	return (
		<div className={className}>
			<StyleGuideContextProviders
				dataValue={dataContextValue}
				testValue={testContextValue}
				uiValue={uiContextValue}
			>
				{isInitialLoading("styleGuide") || isRefreshing("styleGuide") ? (
					<div className="flex items-center justify-center h-[60vh]">
						<Loader size="xl" />
					</div>
				) : (
					<div className="space-y-6">
						{localSettings.enabled && isHealthy === true && <StyleGuideRules />}
					</div>
				)}
			</StyleGuideContextProviders>
		</div>
	);
};

export default StyleGuideComponent;
