import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { StyleGuideComponentImportButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideComponentImportButton";
import { StyleGuideComponentSaveButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/StyleGuideComponentSaveButton";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Card, CardSubTitle, CardTitle } from "@ui-kit/Card";
import { PageState, PageStateButtonGroup, PageStateDescription, PageStateTitle } from "@ui-kit/PageState";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
} from "@ui-kit/Sidebar";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { useEffect, useState } from "react";
import { FloatingAlert } from "../../ui-kit/FloatingAlert";
import { Spinner } from "../../ui-kit/Spinner";
import { TabErrorBlock } from "../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../ui-kit/TabInitialLoader";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Button } from "@ui-kit/Button";

type ForType = "heading" | "codeBlock" | "plainText";

export type StyleGuideSettings = {
	enabled: boolean;
	lgt: { rules: { xml: string; forTypes: ForType[] }[] };
};

const getTitle = (xml?: string) => {
	const nameRegex =
		/<(?:rule|rulegroup)(?:\s+[^>]*?)?(?:\s+name="([^"]*)"|\s+id="[^"]*"\s+name="([^"]*)"|\s+name="([^"]*)"\s+id="[^"]*")(?:\s+[^>]*?)?>/;
	const match = (xml ?? "").match(nameRegex);
	if (match) return match[1] || match[2] || match[3] || "";
	return "";
};

const FOR_TYPE_NAMES: Record<ForType, string> = {
	heading: "Заголовки",
	codeBlock: "Блоки кода",
	plainText: "Простой текст",
};
const getForTypeName = (forType: ForType) => {
	if (!FOR_TYPE_NAMES[forType]) return "";
	return FOR_TYPE_NAMES[forType];
};

const StyleGuideComponent = () => {
	const {
		settings,
		updateStyleGuide,
		ensureStyleGuideLoaded,
		isInitialLoading,
		isRefreshing,
		getTabError,
		healthcheckStyleGuide,
	} = useSettings();
	const checkSettings = settings?.styleGuide;
	const [localSettings, setLocalSettings] = useState<StyleGuideSettings>({
		enabled: false,
		lgt: { rules: [] },
	});
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [isHealthy, setIsHealthy] = useState(null);
	const isEqual = useCheck(checkSettings, localSettings);

	useEffect(() => {
		setLocalSettings(checkSettings || { enabled: false, lgt: { rules: [] } });
	}, [checkSettings]);

	useEffect(() => {
		if (!localSettings?.lgt?.rules?.length || !isEqual) return;
		void healthcheckStyleGuide().then((res) => setIsHealthy(res));
	}, [localSettings?.lgt?.rules?.length, isEqual]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateStyleGuide(localSettings);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	const tabError = getTabError("styleGuide");

	if (isInitialLoading("styleGuide")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureStyleGuideLoaded(true)} />;
	}

	const handleToggle = async (enabled: boolean) => {
		setIsSaving(true);
		try {
			await updateStyleGuide({ enabled, lgt: { rules: [] } });
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const Title = (
		<>
			<div className="flex flex-row justify-between sticky top-0 bg-background pt-3 pb-3">
				<h1 className="flex items-center text-2xl font-bold h-[40px] gap-2">
					{getAdminPageTitle(Page.STYLEGUIDE)} <Spinner size="small" show={isRefreshing("styleGuide")} />
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
							<TooltipContent>Сервис стайлгайда недоступен</TooltipContent>
						</Tooltip>
					)}
				</h1>
				<div className="flex gap-2 items-center">
					{localSettings.lgt.rules.length > 0 && (
						<>
							<StyleGuideComponentImportButton setLocalSettings={setLocalSettings} />
							<StyleGuideComponentSaveButton
								isSaving={isSaving}
								handleSave={handleSave}
								isEqual={isEqual}
							/>
						</>
					)}
					<SwitchField
						label={
							localSettings.enabled
								? t("enterprise.admin.check.switch.on")
								: t("enterprise.admin.check.switch.off")
						}
						alignment="right"
						className="gap-2"
						disabled={isSaving}
						checked={localSettings.enabled}
						onCheckedChange={handleToggle}
					/>
				</div>
			</div>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />
		</>
	);

	if (!localSettings.enabled) return Title;

	return (
		<>
			{Title}
			{!localSettings.lgt.rules.length && (
				<PageState>
					<PageStateTitle>{t("enterprise.admin.check.no-rules")}</PageStateTitle>
					<PageStateDescription>{t("enterprise.admin.check.no-rules-description")}</PageStateDescription>
					<PageStateButtonGroup>
						<StyleGuideComponentImportButton setLocalSettings={setLocalSettings} />
						<StyleGuideComponentSaveButton isSaving={isSaving} handleSave={handleSave} isEqual={isEqual} />
					</PageStateButtonGroup>
				</PageState>
			)}

			{localSettings.lgt.rules.length > 0 && (
				<SidebarProvider className="min-h-auto">
					<Sidebar collapsible="none" className="min-w-[400px] rounded-md">
						<SidebarContent>
							<SidebarGroup>
								<SidebarGroupContent>
									<SidebarMenu>
										<div className="flex flex-col gap-1 min-w-[250px] overflow-y-auto h-[calc(100vh-100px)]">
											{localSettings.lgt.rules.map((rule, index) => (
												<SidebarMenuItem key={index}>
													<SidebarMenuButton
														isActive={currentIndex === index}
														onClick={() => setCurrentIndex(index)}
													>
														<span>{`${index + 1}. ${getTitle(rule.xml)}`}</span>
													</SidebarMenuButton>
												</SidebarMenuItem>
											))}
										</div>
									</SidebarMenu>
								</SidebarGroupContent>
							</SidebarGroup>
						</SidebarContent>
					</Sidebar>
					<main className="flex-1 ml-2">
						{localSettings.lgt.rules?.[currentIndex] && (
							<Card className="mx-4">
								<CardTitle className="text-xl">
									{getTitle(localSettings.lgt.rules[currentIndex].xml)}
								</CardTitle>

								<CardSubTitle className="text-sm">{t("enterprise.admin.check.rule")}</CardSubTitle>

								<AutogrowTextarea
									className="font-mono mt-2 max-h-96"
									value={localSettings.lgt.rules[currentIndex].xml}
									readOnly
								/>
								{localSettings.lgt.rules[currentIndex]?.forTypes?.length > 0 && (
									<div className="space-y-2 mt-6">
										<strong>{t("enterprise.admin.check.rule-types-description")}</strong>
										<ol className="ml-5 list-decimal">
											{localSettings.lgt.rules[currentIndex].forTypes.map((type, idx) => (
												<li key={type + idx}>{getForTypeName(type)}</li>
											))}
										</ol>
									</div>
								)}
							</Card>
						)}
					</main>
				</SidebarProvider>
			)}
		</>
	);
};

export default StyleGuideComponent;
