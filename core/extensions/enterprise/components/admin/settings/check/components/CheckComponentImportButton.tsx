import { CheckSettings } from "@ext/enterprise/components/admin/settings/check/CheckComponent";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Input } from "@ui-kit/Input";

export const CheckComponentImportButton = ({
	setLocalSettings,
}: {
	setLocalSettings: (settings: CheckSettings) => void;
}) => {
	return (
		<div className="relative cursor-pointer">
			<Input
				className="opacity-0 cursor-pointer absolute w-full h-full top-0 file:cursor-pointer z-10"
				type="file"
				accept=".json"
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
							setLocalSettings({ lgt: { rules } });
						}
					} catch (error) {
						console.error(error);
					}
				}}
			/>
			<Button variant="outline" className="relative">
				{t("enterprise.admin.check.import-rules")}
			</Button>
		</div>
	);
};
