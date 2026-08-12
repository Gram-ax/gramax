import type { StyleGuideSettings } from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import { downloadJson } from "@ext/enterprise/components/admin/settings/styleGuide/utils/downloadJson";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

interface StyleGuideComponentExportButtonProps {
	localSettings: StyleGuideSettings;
}

export const StyleGuideComponentExportButton = ({ localSettings }: StyleGuideComponentExportButtonProps) => {
	const handleExport = () => {
		const languageToolRules = (localSettings.lgt?.rules ?? []).map((rule) => ({
			guid: rule.guid,
			xml: rule.xml,
			forTypes: rule.forTypes ?? [],
			enabled: rule.enabled ?? true,
			examples:
				rule.testCases.map((test) => {
					return {
						...test,
						guid: test.id,
					};
				}) ?? [],
		}));

		const rules = (localSettings.llm?.rules ?? []).map((rule) => ({
			guid: rule.guid,
			name: rule.name,
			description: rule.llmPrompt ?? "",
			forTypes: rule.forTypes ?? [],
			enabled: rule.enabled ?? true,
			examples:
				rule.testCases.map((test) => {
					return {
						...test,
						guid: test.id,
					};
				}) ?? [],
		}));

		const result = {
			languageToolRules,
			rules,
		};

		downloadJson(result, "style-guide-rules.json");
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div>
					<IconButton icon="download" onClick={handleExport} variant="outline" />
				</div>
			</TooltipTrigger>
			<TooltipContent className="font-sans font-normal">
				{t("enterprise.admin.check.export-rules")}
			</TooltipContent>
		</Tooltip>
	);
};
