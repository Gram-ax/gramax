import {
	generateGuid,
	type StyleGuideSettings,
} from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { Input } from "@ui-kit/Input";
import type { Dispatch, SetStateAction } from "react";

export const StyleGuideComponentImportButton = ({
	setLocalSettings,
	asDropdownItem = false,
}: {
	setLocalSettings: Dispatch<SetStateAction<StyleGuideSettings>>;
	asDropdownItem?: boolean;
}) => {
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
					description: rule.description,
					forTypes: rule?.forTypes ?? [],
					testCases: rule.examples ?? [],
				}));

				setLocalSettings((prev) => ({
					...prev,
					lgt: { ...prev.lgt, rules: lgtRules },
					llm: {
						...prev.llm,
						rules: llmRules,
					},
				}));
			}
		} catch (error) {
			console.error(error);
		}
	};

	if (asDropdownItem) {
		return (
			<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
				<label className="cursor-pointer w-full" htmlFor="file-upload-dropdown">
					{t("enterprise.admin.check.import-rules")}
					<Input
						accept=".json"
						className="hidden"
						id="file-upload-dropdown"
						onChange={handleFileChange}
						type="file"
					/>
				</label>
			</DropdownMenuItem>
		);
	}

	return (
		<div className="relative cursor-pointer">
			<Input
				accept=".json"
				className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer z-10"
				onChange={handleFileChange}
				type="file"
			/>
			<Button className="relative" variant="outline">
				{t("enterprise.admin.check.import-rules")}
			</Button>
		</div>
	);
};
