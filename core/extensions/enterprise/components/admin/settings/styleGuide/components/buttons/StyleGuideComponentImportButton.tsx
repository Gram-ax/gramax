import type { StyleGuideSettings } from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import { generateGuid } from "@ext/enterprise/components/admin/settings/styleGuide/utils/generateGuid";
import t from "@ext/localization/locale/translate";
import { IconButton } from "@ui-kit/Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type Dispatch, type SetStateAction, useRef } from "react";

interface StyleGuideComponentImportButtonProps {
	setLocalSettings: Dispatch<SetStateAction<StyleGuideSettings>>;
	handleSave: (updatedSettings: StyleGuideSettings) => Promise<void>;
}

export const StyleGuideComponentImportButton = ({
	setLocalSettings,
	handleSave,
}: StyleGuideComponentImportButtonProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		try {
			const file = e.target.files?.[0];
			if (file) {
				const text = await file.text();
				const { languageToolRules, rules: importedLlmRules } = JSON.parse(text);

				const lgtRules = (languageToolRules ?? []).map((rule) => ({
					guid: rule.guid || generateGuid(),
					xml: rule.xml,
					forTypes: rule?.forTypes ?? [],
					enabled: rule.enabled ?? true,
					testCases: rule.examples ?? [],
				}));

				const llmRules = (importedLlmRules ?? []).map((rule) => ({
					guid: rule.guid || generateGuid(),
					name: rule.name,
					llmPrompt: rule.description || "",
					forTypes: rule?.forTypes ?? [],
					enabled: rule.enabled ?? true,
					testCases: rule.examples ?? [],
				}));

				setLocalSettings((prev) => {
					const updated = {
						...prev,
						lgt: { rules: lgtRules },
						llm: { rules: llmRules },
					};
					void handleSave(updated);
					return updated;
				});
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="relative cursor-pointer w-fit" onClick={() => inputRef.current?.click()}>
			<input accept=".json" className="hidden" onChange={handleFileChange} ref={inputRef} type="file" />
			<Tooltip>
				<TooltipTrigger asChild>
					<IconButton icon="upload" variant="outline" />
				</TooltipTrigger>
				<TooltipContent className="font-sans font-normal">
					{t("enterprise.admin.check.import-rules")}
				</TooltipContent>
			</Tooltip>
		</div>
	);
};
