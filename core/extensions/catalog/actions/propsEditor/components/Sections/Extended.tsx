import t from "@ext/localization/locale/translate";
import { FormField } from "@ui-kit/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { FORM_DATA_QA, FORM_STYLES } from "../../consts/form";
import type { SelectOption } from "../../logic/createFormSchema";

export type ExtendedProps = {
	syntaxes: SelectOption[];
};

export const EditExtendedProps = ({ syntaxes }: ExtendedProps) => {
	return (
		<FormField
			name="syntax"
			title={t("forms.catalog-extended-edit-props.props.syntax.name")}
			description={t("forms.catalog-extended-edit-props.props.syntax.description")}
			control={({ field }) => (
				<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
					<SelectTrigger data-qa={FORM_DATA_QA.SYNTAX}>
						<SelectValue placeholder={t("forms.catalog-extended-edit-props.props.syntax.placeholder")} />
					</SelectTrigger>
					<SelectContent>
						{syntaxes.map(({ value, children }) => (
							<SelectItem
								data-qa={FORM_DATA_QA.CLICKABLE}
								key={value}
								children={children}
								value={value}
							/>
						))}
					</SelectContent>
				</Select>
			)}
			labelClassName={FORM_STYLES.LABEL_WIDTH}
		/>
	);
};
