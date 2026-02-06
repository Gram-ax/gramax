import { StyleGuideSettings } from "@ext/enterprise/components/admin/settings/styleGuide/StyleGuideComponent";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Input } from "@ui-kit/Input";
import { Dispatch, SetStateAction } from "react";

export const StyleGuideComponentImportButton = ({
	setLocalSettings,
}: {
	setLocalSettings: Dispatch<SetStateAction<StyleGuideSettings>>;
}) => {
	return (
		<div className="relative cursor-pointer">
			<Input
				accept=".json"
				className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer z-10"
				onChange={async (e) => {
					try {
						const file = e.target.files?.[0];
						if (file) {
							const text = await file.text();
							const { languageToolRules } = JSON.parse(text);
							const rules = languageToolRules.map((rule: any) => ({
								xml: rule.xml,
								forTypes: rule?.forTypes ?? [],
							}));
							setLocalSettings((prev) => ({
								...prev,
								lgt: { rules },
							}));
						}
					} catch (error) {
						console.error(error);
					}
				}}
				type="file"
			/>
			<Button className="relative" variant="outline">
				{t("enterprise.admin.check.import-rules")}
			</Button>
		</div>
	);
};
