import { useStyleGuideData } from "@ext/enterprise/components/admin/settings/styleGuide/helpers/StyleGuideContext";
import { downloadJson } from "@ext/enterprise/components/admin/settings/styleGuide/utils/downloadJson";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";

export const StyleGuideComponentExportButton = () => {
	const { localSettings } = useStyleGuideData();

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
			<TooltipContent>{t("enterprise.admin.check.export-rules")}</TooltipContent>
		</Tooltip>
	);
};
