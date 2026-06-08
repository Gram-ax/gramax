import t from "@ext/localization/locale/translate";
import { FormControl, FormFieldControl, FormItem, FormLabel, FormMessage } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import type { Control } from "react-hook-form";

const FOR_TYPE_OPTIONS = [
	{ value: "heading", label: t("enterprise.admin.check.rules-types.heading") },
	{ value: "plainText", label: t("enterprise.admin.check.rules-types.plainText") },
];

interface ForTypesFieldProps {
	control: Control;
	disabled: boolean;
}

export const ForTypesField = ({ control, disabled }: ForTypesFieldProps) => (
	<FormFieldControl
		control={control}
		name="forTypes"
		render={({ field }) => (
			<FormItem>
				<FormLabel>{t("enterprise.admin.check.rule-type-label")}</FormLabel>
				<FormControl>
					<MultiSelect
						disabled={disabled}
						loadOptions={() => Promise.resolve({ options: FOR_TYPE_OPTIONS })}
						onChange={field.onChange}
						placeholder={t("enterprise.admin.check.rule-types-placeholder")}
						value={field.value as Array<{ value: string | number; label: string }>}
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		)}
	/>
);
