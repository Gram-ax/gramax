import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import { FORM_DATA_QA, FORM_STYLES } from "@ext/catalog/actions/propsEditor/consts/form";
import { useFormSelectValues } from "@ext/catalog/actions/propsEditor/hooks/useFormSelectValues";
import t from "@ext/localization/locale/translate";
import { useSetting } from "@ext/settings/logic/hooks";
import { FormDescription, FormField, FormSectionTitle, FormStack } from "@ui-kit/Form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { TagInput } from "@ui-kit/TagInput";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "../../logic/createFormSchema";

interface LanguageAndVersionsProps {
	form: UseFormReturn<FormData>;
}

export const EditLanguageAndVersionsProps = ({ form }: LanguageAndVersionsProps) => {
	const { languages } = useFormSelectValues();
	const [language] = useSetting("general.language");

	return (
		<SectionContainer stackClassName="space-y-9 lg:space-y-10">
			<FormStack className="space-y-4">
				<div className="space-y-0.5">
					<FormSectionTitle className="flex items-center gap-2">{t("multilang.name")} </FormSectionTitle>
					<FormDescription>
						{t("multilang.description")}
						<a
							className="pl-1 !text-[color:var(--color-link)]"
							href={
								language === "ru"
									? "https://gram.ax/resources/docs/catalog/multilanguage"
									: "https://gram.ax/resources/docs/en/catalog/multilanguage"
							}
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("more")}
						</a>
					</FormDescription>
				</div>
				<FormField
					control={({ field }) => (
						<Select
							disabled={!!form.formState.defaultValues?.language}
							onValueChange={(value) => field.onChange(value || "")}
							value={field.value || ""}
						>
							<SelectTrigger
								data-qa={FORM_DATA_QA.LANGUAGE}
								onClear={field.value ? () => field.onChange("") : undefined}
							>
								<SelectValue placeholder={t("forms.catalog-edit-props.props.language.placeholder")} />
							</SelectTrigger>
							<SelectContent>
								{languages.map(({ value, children }) => (
									<SelectItem data-qa={"qa-clickable"} key={value} value={value}>
										{children}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
					description={t("forms.catalog-edit-props.props.language.description")}
					labelClassName={FORM_STYLES.LABEL_WIDTH}
					layout="horizontal"
					name="language"
					title={t("forms.catalog-edit-props.props.language.name")}
				/>
			</FormStack>

			<FormStack>
				<div className="space-y-0.5">
					<FormSectionTitle className="flex items-center gap-2">{t("versions.name")}</FormSectionTitle>
					<FormDescription>
						{t("versions.description")}
						<a
							className="pl-1 !text-[color:var(--color-link)]"
							href={
								language === "ru"
									? "https://gram.ax/resources/docs/catalog/versioning"
									: "https://gram.ax/resources/docs/en/catalog/versioning"
							}
							rel="noopener noreferrer"
							target="_blank"
						>
							{t("more")}
						</a>
					</FormDescription>
				</div>
				<FormField
					control={({ field }) => (
						<TagInput
							onChange={(values) => field.onChange(values)}
							placeholder={t("forms.catalog-edit-props.props.versions.placeholder")}
							value={field.value || []}
						/>
					)}
					description={t("forms.catalog-edit-props.props.versions.description")}
					labelClassName={FORM_STYLES.LABEL_WIDTH}
					layout="horizontal"
					name="versions"
					title={t("forms.catalog-edit-props.props.versions.name")}
				/>
			</FormStack>
		</SectionContainer>
	);
};
