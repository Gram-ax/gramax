import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import t from "@ext/localization/locale/translate";
import isSystemProperty from "@ext/properties/logic/isSystemProperty";
import { feature } from "@ext/toggleFeatures/features";
import { FormField } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { MultiSelect } from "ics-ui-kit/components/search-select";
import { TagInput } from "ics-ui-kit/components/tag-input";
import { FORM_DATA_QA } from "../../consts/form";
import type { FormProps, SelectOption } from "../../logic/createFormSchema";

export type BasicProps = {
	formProps: FormProps;
	languages: SelectOption[];
	originalProps: Record<string, any>;
	sourceType: string | undefined;
	inputRef?: React.RefObject<HTMLInputElement>;
};

export const EditBasicProps = ({ formProps, languages, originalProps, sourceType, inputRef }: BasicProps) => {
	const catalogProps = CatalogPropsService.value;

	return (
		<>
			<FormField
				name="title"
				title={t("forms.catalog-edit-props.props.title.name")}
				description={t("forms.catalog-edit-props.props.title.description")}
				required
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.TITLE}
						placeholder={t("forms.catalog-edit-props.props.title.placeholder")}
						{...field}
						ref={inputRef}
					/>
				)}
				{...formProps}
			/>

			<FormField
				name="url"
				title={t("forms.catalog-edit-props.props.url.name")}
				description={t("forms.catalog-edit-props.props.url.description")}
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.URL}
						placeholder={t("forms.catalog-edit-props.props.url.placeholder")}
						{...field}
						readOnly={!!sourceType}
					/>
				)}
				{...formProps}
			/>

			<FormField
				name="docroot"
				title={t("forms.catalog-edit-props.props.docroot.name")}
				description={t("forms.catalog-edit-props.props.docroot.description")}
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.DOCROOT}
						placeholder={t("forms.catalog-edit-props.props.docroot.placeholder")}
						{...field}
					/>
				)}
				{...formProps}
			/>

			<FormField
				name="language"
				title={t("forms.catalog-edit-props.props.language.name")}
				description={t("forms.catalog-edit-props.props.language.description")}
				control={({ field }) => (
					<Select
						onValueChange={field.onChange}
						disabled={Boolean(originalProps.language)}
						defaultValue={field.value || undefined}
					>
						<SelectTrigger data-qa={FORM_DATA_QA.LANGUAGE}>
							<SelectValue placeholder={t("forms.catalog-edit-props.props.language.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							{languages.map(({ value, children }) => (
								<SelectItem data-qa={"qa-clickable"} key={value} children={children} value={value} />
							))}
						</SelectContent>
					</Select>
				)}
				{...formProps}
			/>

			<FormField
				name="versions"
				title={t("forms.catalog-edit-props.props.versions.name")}
				description={t("forms.catalog-edit-props.props.versions.description")}
				control={({ field }) => (
					<TagInput
						placeholder={t("forms.catalog-edit-props.props.versions.placeholder")}
						value={field.value || []}
						onChange={(values) => field.onChange(values)}
					/>
				)}
				{...formProps}
			/>

			{feature("filtered-catalog") &&
				catalogProps.properties?.filter((p) => !isSystemProperty(p.name)).length > 0 && (
					<FormField
						name="filterProperties"
						title={t("forms.catalog-edit-props.props.filterProperties.name")}
						description={t("forms.catalog-edit-props.props.filterProperties.description")}
						control={({ field }) => (
							<MultiSelect
								keepOpenOnSelect
								value={field.value?.map((value) => ({
									value,
									label: value,
								}))}
								placeholder={t("forms.catalog-edit-props.props.filterProperties.placeholder")}
								loadOptions={async () => ({
									options:
										catalogProps.properties
											?.filter((p) => !isSystemProperty(p.name))
											.map((property) => ({
												value: property.name,
												label: property.name,
											})) || [],
								})}
								onChange={(options) => {
									field.onChange(options.map((option) => option.value));
								}}
							/>
						)}
						{...formProps}
					/>
				)}
		</>
	);
};
