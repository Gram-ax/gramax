import { useFormSelectValues } from "@ext/catalog/actions/propsEditor/hooks/useFormSelectValues";
import t from "@ext/localization/locale/translate";
import { FormField } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { UseFormReturn } from "react-hook-form";
import { FORM_DATA_QA } from "../../consts/form";
import type { FormProps } from "../../logic/createFormSchema";
import { FormData } from "../../logic/createFormSchema";
import UploadCatalogLogo from "../UploadCatalogLogo";

export type AppearanceProps = {
	form: UseFormReturn<FormData>;
	formProps: FormProps;
};

export const EditAppearanceProps = ({ form, formProps }: AppearanceProps) => {
	const { cardColors } = useFormSelectValues();

	return (
		<>
			<FormField
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.DESCRIPTION}
						placeholder={t("forms.catalog-edit-props.props.description.placeholder")}
						{...field}
					/>
				)}
				name="description"
				title={t("forms.catalog-edit-props.props.description.name")}
				{...formProps}
			/>

			<FormField
				control={({ field }) => (
					<Select onValueChange={field.onChange} value={field.value || undefined}>
						<SelectTrigger onClear={field.value ? () => field.onChange(null) : undefined}>
							<SelectValue placeholder={t("forms.catalog-edit-props.props.style.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							{cardColors.map((color) => (
								<SelectItem children={color.children} key={color.value} value={color.value} />
							))}
						</SelectContent>
					</Select>
				)}
				name="style"
				title={t("forms.catalog-edit-props.props.style.name")}
				{...formProps}
			/>

			<UploadCatalogLogo form={form} formProps={formProps} />
		</>
	);
};
