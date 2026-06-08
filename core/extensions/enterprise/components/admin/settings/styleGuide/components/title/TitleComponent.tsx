import { StyleGuideComponentExportButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentExportButton";
import { StyleGuideComponentImportButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentImportButton";
import { StyleGuideComponentTestButton } from "@ext/enterprise/components/admin/settings/styleGuide/components/buttons/StyleGuideComponentTestButton";
import { StickyHeader } from "@ext/enterprise/components/admin/ui-kit/StickyHeader";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

export type TitleProps = {
	isHealthy: boolean;
	isUiLocked: boolean;
	isModuleEnabled: boolean;
	hasRules: boolean;
};

export const TitleComponent = ({ isHealthy, isUiLocked, isModuleEnabled, hasRules }: TitleProps) => (
	<StickyHeader
		actions={
			isModuleEnabled && (
				<>
					<StyleGuideComponentImportButton />
					{hasRules && (
						<>
							<StyleGuideComponentExportButton />
							<StyleGuideComponentTestButton isUiLocked={isUiLocked} />
						</>
					)}
				</>
			)
		}
		title={
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
						<TooltipContent>{t("enterprise.admin.check.service-unavailable")}</TooltipContent>
					</Tooltip>
				)}
			</>
		}
	/>
);
