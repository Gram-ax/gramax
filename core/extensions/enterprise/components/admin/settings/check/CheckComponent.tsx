import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { CheckComponentImportButton } from "@ext/enterprise/components/admin/settings/check/components/CheckComponentImportButton";
import { CheckComponentSaveButton } from "@ext/enterprise/components/admin/settings/check/components/CheckComponentSaveButton";
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

type ForType = "heading" | "codeBlock" | "plainText";

export type CheckSettings = { lgt: { rules: { xml: string; forTypes: ForType[] }[] } };

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

const CheckComponent = () => {
	const { settings, updateCheck, ensureCheckLoaded, isInitialLoading, isRefreshing, getTabError } = useSettings();
	const checkSettings = settings?.check;
	const [localSettings, setLocalSettings] = useState<CheckSettings>({ lgt: { rules: [] } });
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const isEqual = useCheck(checkSettings, localSettings);

	useEffect(() => {
		setLocalSettings(checkSettings || { lgt: { rules: [] } });
	}, [checkSettings]);

	const handleSave = async () => {
		setIsSaving(true);
		try {
			await updateCheck(localSettings);
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

	const tabError = getTabError("check");

	if (isInitialLoading("check")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureCheckLoaded(true)} />;
	}

	return (
		<>
			<div className="flex flex-row justify-between sticky top-0 bg-background pt-3 pb-3">
				<h1 className="flex items-center text-2xl font-bold h-[40px]">
					{getAdminPageTitle(Page.CHECK)} <Spinner size="small" show={isRefreshing("check")} />
				</h1>
				{localSettings.lgt.rules.length > 0 && (
					<div className="flex gap-2 items-center ">
						<CheckComponentImportButton setLocalSettings={setLocalSettings} />
						<CheckComponentSaveButton isSaving={isSaving} handleSave={handleSave} isEqual={isEqual} />
					</div>
				)}
			</div>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />

			{!localSettings.lgt.rules.length && (
				<PageState>
					<PageStateTitle>{t("enterprise.admin.check.no-rules")}</PageStateTitle>
					<PageStateDescription>{t("enterprise.admin.check.no-rules-description")}</PageStateDescription>
					<PageStateButtonGroup>
						<CheckComponentImportButton setLocalSettings={setLocalSettings} />
						<CheckComponentSaveButton isSaving={isSaving} handleSave={handleSave} isEqual={isEqual} />
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
					<main className="flex-1">
						{localSettings.lgt.rules?.[currentIndex] && (
							<Card className="mx-4">
								<CardTitle className="text-xl">
									{getTitle(localSettings.lgt.rules[currentIndex].xml)}
								</CardTitle>

								<CardSubTitle className="text-sm">{t("enterprise.admin.check.rule")}</CardSubTitle>

								<AutogrowTextarea
									className="font-mono mt-2 max-h-96"
									defaultValue={localSettings.lgt.rules[currentIndex].xml}
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

export default CheckComponent;
