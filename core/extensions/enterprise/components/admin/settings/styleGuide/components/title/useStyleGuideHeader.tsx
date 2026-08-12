import { useAdminHeader } from "@ext/enterprise/components/admin/hooks/useAdminHeader";
import { StyleGuideComponentExportButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentExportButton";
import { StyleGuideComponentImportButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentImportButton";
import {
	StyleGuideGlobalTestButton,
	type StyleGuideTestManager,
} from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentTestButton";
import type { StyleGuideSettings } from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { Dispatch, SetStateAction } from "react";

export type StyleGuideHeaderParams = {
	isHealthy: boolean;
	isUiLocked: boolean;
	isModuleEnabled: boolean;
	isContentUnavailable: boolean;
	hasRules: boolean;
	localSettings: StyleGuideSettings;
	setLocalSettings: Dispatch<SetStateAction<StyleGuideSettings>>;
	handleSave: (updatedSettings: StyleGuideSettings) => Promise<void>;
	testManager: StyleGuideTestManager;
};

export const useStyleGuideHeader = (params: StyleGuideHeaderParams) => {
	const {
		isHealthy,
		isUiLocked,
		isModuleEnabled,
		isContentUnavailable,
		hasRules,
		localSettings,
		setLocalSettings,
		handleSave,
		testManager,
	} = params;

	const showActions = !isContentUnavailable && isModuleEnabled && isHealthy;

	useAdminHeader({
		title: (
			<>
				{getAdminPageTitle(Page.STYLEGUIDE)}
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
							{t("enterprise.admin.check.service-unavailable")}
						</TooltipContent>
					</Tooltip>
				)}
			</>
		),
		actions: showActions && (
			<>
				<StyleGuideComponentImportButton handleSave={handleSave} setLocalSettings={setLocalSettings} />
				{hasRules && (
					<>
						<StyleGuideComponentExportButton localSettings={localSettings} />
						<StyleGuideGlobalTestButton isUiLocked={isUiLocked} testManager={testManager} />
					</>
				)}
			</>
		),
	});
};
