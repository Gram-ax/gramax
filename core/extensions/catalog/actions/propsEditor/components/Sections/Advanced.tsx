import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import { FORM_DATA_QA, FORM_STYLES } from "@ext/catalog/actions/propsEditor/consts/form";
import { useFormSelectValues } from "@ext/catalog/actions/propsEditor/hooks/useFormSelectValues";
import t from "@ext/localization/locale/translate";
import { FormField } from "@ui-kit/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";

export const EditAdvancedProps = () => {
	const { syntaxes } = useFormSelectValues();

	return (
		<SectionContainer>
			<FormField
				control={({ field }) => (
					<Select defaultValue={field.value || undefined} onValueChange={field.onChange}>
						<SelectTrigger data-qa={FORM_DATA_QA.SYNTAX}>
							<SelectValue
								placeholder={t("forms.catalog-extended-edit-props.props.syntax.placeholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							{syntaxes.map(({ value, children }) => (
								<SelectItem data-qa={FORM_DATA_QA.CLICKABLE} key={value} value={value}>
									{children}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
				description={t("forms.catalog-extended-edit-props.props.syntax.description")}
				labelClassName={FORM_STYLES.LABEL_WIDTH}
				layout="horizontal"
				name="syntax"
				title={t("forms.catalog-extended-edit-props.props.syntax.name")}
			/>
		</SectionContainer>
	);
};
