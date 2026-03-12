import styled from "@emotion/styled";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useTabGuard } from "@ext/enterprise/components/admin/hooks/useTabGuard";
import { StyleGuideComponentImportButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideComponentImportButton";
import { StyleGuideComponentSaveButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideComponentSaveButton";
import {
	DEFAULT_SYSTEM_PROMPT,
	StyleGuidePromptModal,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuidePromptModal";
import { TestSection } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideTestSection";
import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Card } from "@ui-kit/Card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Loader } from "@ui-kit/Loader";
import { PageState, PageStateDescription } from "@ui-kit/PageState";
import { SidebarProvider } from "@ui-kit/Sidebar";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Ban, FastForward, LoaderCircle, MoreVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import StyleGuideEditor from "./components/StyleGuideEditor";
import { StyleGuideSidebar } from "./components/StyleGuideSidebar";
import { createHandlers } from "./hooks/createHandlers";
import { useActiveRule } from "./hooks/useActiveRule";
import { useRuleStorage } from "./hooks/useRuleStorage";
import { useTestManager } from "./hooks/useTestManager";

export type ForType = "heading" | "plainText";
export type ForTypeObject = { code: ForType };

export type ExampleRunResult = {
	result: { suggestions: { text: string; id: number }[] };
	statusCode: "success" | "failed";
	dateTimeIso8601: string;
};

export type RuleExample = {
	isCorrect: boolean;
	text: string;
	runResult?: ExampleRunResult;
};

export type LgtRule = {
	guid: string;
	xml: string;
	forTypes?: ForTypeObject[];
	enabled?: boolean;
	testCases?: RuleExample[];
};

export type LlmRule = {
	guid: string;
	name: string;
	llmPrompt: string;
	enabled?: boolean;
	testCases?: RuleExample[];
	forTypes?: ForTypeObject[];
};

export type StyleGuideSettings = {
	enabled: boolean;
	lgt: { rules: LgtRule[] };
	llm?: { rules: LlmRule[] };
	systemPrompt?: { text: string };
};

export function generateGuid(): string {
	const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	return `${S4()}${S4()}-4${S4().substring(0, 3)}-${S4()}-${S4()}${S4()}${S4()}`.toLowerCase();
}

const useCheck = (original, current) => {
	return useMemo(() => {
		const checkSettings = JSON.stringify(original);
		const localSettings = JSON.stringify(current);
		return checkSettings === localSettings;
	}, [original, current]);
}; //TODO_RM: change it to a flag that will always show that something is chmaged if form field was changed

const StyleGuideComponent = ({ className }: { className?: string }) => {
	const {
		settings,
		updateStyleGuide,
		checkStyleGuide,
		ensureStyleGuideLoaded,
		isInitialLoading,
		isRefreshing,
		getTabError,
		clearTabError,
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
	const [isEnabling, setIsEnabling] = useState(false);
	const [isRetrying, setIsRetrying] = useState(false);
	const [runtimeError, setRuntimeError] = useState<string | null>(null);
	const [hasAttemptedDisable, setHasAttemptedDisable] = useState(false);
	const isEqual = useCheck(checkSettings, localSettings);
	const hasUnsavedChanges = !isEqual;
	const isUiLocked = isInitialLoading("styleGuide") || isRefreshing("styleGuide") || isSaving || isEnabling;

	const activeRule = useActiveRule();
	const ruleStorage = useRuleStorage(activeRule, localSettings, setLocalSettings);
	const testManager = useTestManager(
		localSettings,
		setLocalSettings,
		checkStyleGuide,
		setRunningTests,
		setIsRunningAllTests,
	);

	const isAnyTestRunning = runningTests.size > 0 || isRunningAllTests;

	const handlers = createHandlers(activeRule, ruleStorage, testManager);

	useEffect(() => {
		setLocalSettings(checkSettings || { enabled: false, lgt: { rules: [] } });
	}, [checkSettings]);

	useEffect(() => {
		const runHealthcheck = async () => {
			try {
				const result = await healthcheckStyleGuide();
				setIsHealthy(result);
				if (!result && checkSettings?.enabled && !hasAttemptedDisable) {
					setHasAttemptedDisable(true);
					try {
						await updateStyleGuide({ ...checkSettings, enabled: false });
					} catch (e) {
						console.error("Failed to disable module:", e);
						setRuntimeError(
							"Возникла проблема при подключении к сервису, обратитесь в техническую поддержку",
						);
					}
				}
			} catch {
				setIsHealthy(false);
				if (checkSettings?.enabled && !hasAttemptedDisable) {
					setHasAttemptedDisable(true);
					try {
						await updateStyleGuide({ ...checkSettings, enabled: false });
					} catch (e) {
						console.error("Failed to disable module:", e);
						setRuntimeError(
							"Возникла проблема при подключении к сервису, обратитесь в техническую поддержку",
						);
					}
				}
			}
		};
		runHealthcheck();
	}, [healthcheckStyleGuide, hasAttemptedDisable, checkSettings, updateStyleGuide]);

	const handleRetry = useCallback(async () => {
		setIsRetrying(true);
		setRuntimeError(null);
		setHasAttemptedDisable(false);

		try {
			const result = await healthcheckStyleGuide();
			setIsHealthy(result);
			if (result) {
				clearTabError("styleGuide");
			} else if (checkSettings?.enabled) {
				try {
					await updateStyleGuide({ ...checkSettings, enabled: false });
				} catch (e) {
					console.error("Failed to disable module:", e);
					setRuntimeError("Возникла проблема при подключении к сервису, обратитесь в техническую поддержку");
				}
			}
		} catch (_e) {
			setIsHealthy(false);
			if (checkSettings?.enabled) {
				try {
					await updateStyleGuide({ ...checkSettings, enabled: false });
				} catch (e) {
					console.error("Failed to disable module:", e);
					setRuntimeError("Возникла проблема при подключении к сервису, обратитесь в техническую поддержку");
				}
			}
		} finally {
			setIsRetrying(false);
		}
	}, [checkSettings, clearTabError, healthcheckStyleGuide, updateStyleGuide]);

	const handleSave = useCallback(async () => {
		setIsSaving(true);
		try {
			await updateStyleGuide(localSettings);
		} catch (e) {
			setRuntimeError(e?.message || "Ошибка при сохранении настроек");
		} finally {
			setIsSaving(false);
		}
	}, [localSettings, updateStyleGuide]);

	const handleToggle = useCallback(
		async (enabled: boolean) => {
			if (enabled) {
				setIsEnabling(true);
				try {
					const healthy = await healthcheckStyleGuide();
					if (!healthy) {
						setIsEnabling(false);
						return;
					}
					await ensureStyleGuideLoaded(true);
					await updateStyleGuide({
						...localSettings,
						enabled: true,
						systemPrompt: localSettings.systemPrompt ?? { text: DEFAULT_SYSTEM_PROMPT },
					});
				} catch (e) {
					setRuntimeError(e?.message || "Возникла проблема при включении модуля");
				} finally {
					setIsEnabling(false);
				}
			} else {
				setIsSaving(true);
				try {
					await updateStyleGuide({ ...localSettings, enabled: false });
				} catch (e) {
					setRuntimeError(e?.message || "Ошибка при отключении модуля");
				} finally {
					setIsSaving(false);
				}
			}
		},
		[localSettings, healthcheckStyleGuide, ensureStyleGuideLoaded, updateStyleGuide],
	);

	useTabGuard({
		page: Page.STYLEGUIDE,
		hasChanges: () => {
			if (isInitialLoading("styleGuide") || !checkSettings) return false;
			return hasUnsavedChanges;
		},
		onSave: handleSave,
		onDiscard: () => {
			if (checkSettings) setLocalSettings(checkSettings);
		},
	});

	useEffect(() => {
		const normalized = checkSettings
			? {
					...checkSettings,
					lgt: {
						rules: checkSettings.lgt.rules.map((r) => ({
							...r,
							guid: r.guid || generateGuid(),
							testCases: r.testCases ?? [],
						})),
					},
					llm: checkSettings.llm
						? {
								rules: checkSettings.llm.rules.map((r) => ({
									...r,
									guid: r.guid || generateGuid(),
									testCases: r.testCases ?? [],
								})),
							}
						: { rules: [] },
				}
			: { enabled: false, lgt: { rules: [] }, llm: { rules: [] } };

		setLocalSettings(normalized);
	}, [checkSettings]);

	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (hasUnsavedChanges) {
				event.preventDefault();
			}
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [hasUnsavedChanges]);

	const selectedLgtRule = localSettings.lgt.rules.find((r) => r.guid === activeRule.selectedLgtGuid);
	const selectedLlmRule = localSettings.llm?.rules?.find((r) => r.guid === activeRule.selectedLlmGuid);

	const tabError = getTabError("styleGuide");
	const hasRules = localSettings.lgt.rules.length > 0 || (localSettings.llm?.rules?.length ?? 0) > 0;

	const hasValidTests = useCallback(() => {
		const lgtRules = localSettings.lgt.rules.filter((r) => r.enabled ?? true);
		const llmRules = (localSettings.llm?.rules ?? []).filter((r) => r.enabled ?? true);

		const hasLgtTests = lgtRules.some((rule) => rule.testCases?.some((tc) => tc.text?.trim()));

		const hasLlmTests = llmRules.some((rule) => rule.testCases?.some((tc) => tc.text?.trim()));

		return hasLgtTests || hasLlmTests;
	}, [localSettings]);

	if (isInitialLoading("styleGuide") || isHealthy === null) {
		return (
			<div className="flex items-center justify-center h-[60vh]">
				<TabInitialLoader />
			</div>
		);
	}

	const Title = (
		<>
			<StickyHeader
				actions={
					<>
						{localSettings.enabled && isHealthy ? (
							<>
								{hasRules && (
									<>
										{isAnyTestRunning ? (
											<Button
												className="abort-test-button"
												disabled={isUiLocked}
												onClick={handlers.test.abort}
												variant="outline"
											>
												<LoaderCircle className="abort-loader animate-spin h-4 w-4 mr-1" />
												<Ban className="abort-stop h-4 w-4 mr-1" />
												Остановить проверку
											</Button>
										) : (
											<Button
												disabled={isUiLocked || !hasValidTests()}
												onClick={handlers.test.runAllGlobal}
												variant="outline"
											>
												<FastForward className="h-4 w-4 mr-1" />
												Запустить все
											</Button>
										)}
										<StyleGuideComponentSaveButton
											disabled={isUiLocked}
											handleSave={handleSave}
											isEqual={isEqual}
											isSaving={isSaving}
										/>
									</>
								)}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button disabled={isUiLocked} size="sm" variant="ghost">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<StyleGuideComponentImportButton
											asDropdownItem
											setLocalSettings={setLocalSettings}
										/>
										<StyleGuidePromptModal
											onChange={(value) =>
												setLocalSettings((prev) => ({
													...prev,
													systemPrompt: { text: value },
												}))
											}
											prompt={localSettings.systemPrompt?.text ?? DEFAULT_SYSTEM_PROMPT}
											title="Системный промпт"
											trigger={
												<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
													Системный промпт
												</DropdownMenuItem>
											}
										/>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : null}
						<SwitchField
							alignment="right"
							checked={localSettings.enabled}
							className="gap-2"
							disabled={!isHealthy}
							label={
								localSettings.enabled
									? t("enterprise.admin.check.switch.on")
									: t("enterprise.admin.check.switch.off")
							}
							onCheckedChange={handleToggle}
						/>
					</>
				}
				title={
					<>
						{getAdminPageTitle(Page.STYLEGUIDE)} <Spinner show={isRefreshing("styleGuide")} size="small" />
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
								<TooltipContent>{t("enterprise.admin.check.service-unavailable")}</TooltipContent>
							</Tooltip>
						)}
					</>
				}
			/>
		</>
	);

	if (isEnabling || isRetrying) {
		return (
			<>
				{Title}
				<div className="flex items-center justify-center h-[60vh]">
					<Loader size="xl" />
				</div>
			</>
		);
	}

	if (localSettings.enabled && runtimeError) {
		return <TabErrorBlock message={runtimeError} onRetry={handleRetry} />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureStyleGuideLoaded(true)} />;
	}

	return (
		<div className={`flex flex-col ${className}`} style={{ height: "100%", maxHeight: "100%" }}>
			{Title}

			{localSettings.enabled && isHealthy === true && (
				<div className="px-6 flex flex-1 overflow-hidden gap-2" style={{ minHeight: 0 }}>
					{" "}
					<SidebarProvider className="flex-1 flex gap-2" style={{ minHeight: 0 }}>
						{" "}
						<div style={{ overflowY: "auto", maxHeight: "100%" }}>
							<StyleGuideSidebar
								activeProvider={activeRule.activeProvider}
								lgtRules={localSettings.lgt.rules}
								llmRules={localSettings.llm?.rules ?? []}
								onActivate={activeRule.activate}
								onAddLgt={handlers.rule.add.lgt}
								onAddLlm={handlers.rule.add.llm}
								selectedLgtGuid={activeRule.selectedLgtGuid}
								selectedLlmGuid={activeRule.selectedLlmGuid}
							/>
						</div>
						<main className="flex-1" style={{ maxHeight: "100%", display: "flex" }}>
							{!hasRules && (
								<main className="flex-1" style={{ maxHeight: "100%" }}>
									{" "}
									<Card className="mx-4">
										<PageState>
											<PageStateDescription>
												У вас пока нет настроенных правил проверки текста. Импортируйте файл с
												правилами или создайте их вручную, чтобы начать работу с проверкой
												орфографии и грамматики.
											</PageStateDescription>
										</PageState>
									</Card>
								</main>
							)}
							{activeRule.activeProvider === "lgt" && selectedLgtRule && (
								<StyleGuideEditor
									handleRuleChange={handlers.rule.updateXml}
									handleRuleDelete={handlers.rule.delete}
									handleRuleNameChange={() => {}}
									handleRuleToggle={handlers.rule.toggle}
									handleTypeChange={handlers.rule.updateTypes}
									isTestRunning={isAnyTestRunning}
									provider="lgt"
									rule={selectedLgtRule}
									TestSection={
										<TestSection
											isAnyTestRunning={isAnyTestRunning}
											onAdd={handlers.test.add}
											onChange={handlers.test.update}
											onDelete={handlers.test.delete}
											onRun={handlers.test.run}
											onRunAll={handlers.test.runAllForRule}
											runningTests={runningTests}
											testCases={selectedLgtRule.testCases}
											testKeyPrefix={selectedLgtRule.guid}
										/>
									}
								/>
							)}

							{activeRule.activeProvider === "llm" && selectedLlmRule && (
								<StyleGuideEditor
									handleRuleChange={handlers.rule.updatePrompt}
									handleRuleDelete={handlers.rule.delete}
									handleRuleNameChange={handlers.rule.updateName}
									handleRuleToggle={handlers.rule.toggle}
									handleTypeChange={handlers.rule.updateTypes}
									isTestRunning={isAnyTestRunning}
									provider="llm"
									rule={selectedLlmRule}
									TestSection={
										<TestSection
											isAnyTestRunning={isAnyTestRunning}
											onAdd={handlers.test.add}
											onChange={handlers.test.update}
											onDelete={handlers.test.delete}
											onRun={handlers.test.run}
											onRunAll={handlers.test.runAllForRule}
											runningTests={runningTests}
											testCases={selectedLlmRule.testCases}
											testKeyPrefix={selectedLlmRule.guid}
										/>
									}
								/>
							)}
						</main>
					</SidebarProvider>
				</div>
			)}
		</div>
	);
};

export default styled(StyleGuideComponent)`
	.abort-test-button .abort-stop {
		display: none;
	}

	.abort-test-button:hover .abort-loader {
		display: none;
	}

	.abort-test-button:hover .abort-stop {
		display: inline;
	}
`;
