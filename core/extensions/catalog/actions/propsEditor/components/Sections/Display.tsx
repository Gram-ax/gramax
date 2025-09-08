import t from "@ext/localization/locale/translate";
import { FormField } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { FORM_DATA_QA } from "../../consts/form";
import type { FormProps, SelectOption } from "../../logic/createFormSchema";
import Schema from "../../model/CatalogEditProps.schema.json";
import type CatalogEditProps from "@ext/catalog/actions/propsEditor/model/CatalogEditProps.schema";

export type DisplayProps = {
	originalProps: CatalogEditProps;
	formProps: FormProps;
	cardColors: string[];
	workspaceGroups: SelectOption[];
};

export const EditDisplayProps = ({ formProps, cardColors, workspaceGroups, originalProps }: DisplayProps) => {
	return (
		<>
			<FormField
				name="description"
				title={t("forms.catalog-edit-props.props.description.name")}
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.DESCRIPTION}
						placeholder={t("forms.catalog-edit-props.props.description.placeholder")}
						{...field}
					/>
				)}
				{...formProps}
			/>

			<FormField
				name="style"
				title={t("forms.catalog-edit-props.props.style.name")}
				control={({ field }) => (
					<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
						<SelectTrigger>
							<SelectValue placeholder={t("forms.catalog-edit-props.props.style.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							{cardColors.map((color, index) => (
								<SelectItem children={color} key={color} value={Schema.properties.style.enum[index]} />
							))}
						</SelectContent>
					</Select>
				)}
				{...formProps}
			/>

			<FormField
				name="code"
				title={t("forms.catalog-edit-props.props.code.name")}
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.CODE}
						placeholder={t("forms.catalog-edit-props.props.code.placeholder")}
						{...field}
					/>
				)}
				{...formProps}
			/>

			{workspaceGroups.length >= 1 && originalProps.group && (
				<FormField
					name="group"
					title={t("forms.catalog-edit-props.props.group.name")}
					control={({ field }) => (
						<Select disabled={!workspaceGroups.length} onValueChange={field.onChange} value={field.value}>
							<SelectTrigger onClear={field.value ? () => field.onChange("") : undefined}>
								<SelectValue placeholder={t("forms.catalog-edit-props.props.group.placeholder")} />
							</SelectTrigger>
							<SelectContent>
								{workspaceGroups.map(({ value, children }) => (
									<SelectItem children={children} key={value} value={value} />
								))}
							</SelectContent>
						</Select>
					)}
					{...formProps}
				/>
			)}
		</>
	);
};
