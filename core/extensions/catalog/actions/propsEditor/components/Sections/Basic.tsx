import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { useFormSelectValues } from "@ext/catalog/actions/propsEditor/hooks/useFormSelectValues";
import t from "@ext/localization/locale/translate";
import isSystemProperty from "@ext/properties/logic/isSystemProperty";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { feature } from "@ext/toggleFeatures/features";
import { FormField } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { usePreventAutoFocusToInput } from "@ui-kit/Modal/utils";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { TagInput } from "ics-ui-kit/components/tag-input";
import { UseFormReturn } from "react-hook-form";
import { FORM_DATA_QA, FORM_STYLES } from "../../consts/form";
import type { FormProps } from "../../logic/createFormSchema";
import { FormData } from "../../logic/createFormSchema";

export type BasicProps = {
	formProps: FormProps;
	form: UseFormReturn<FormData>;
};

export const EditBasicProps = ({ formProps, form }: BasicProps) => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { inputRef } = usePreventAutoFocusToInput(true);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);
	const { languages, syntaxes } = useFormSelectValues();
	const properties = useCatalogPropsStore((state) => state.data?.properties, "shallow");

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
						disabled={!!form.formState.defaultValues?.language}
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

			{feature("filtered-catalog") && properties?.filter((p) => !isSystemProperty(p.name)).length > 0 && (
				<FormField
					name="filterProperties"
					title={t("forms.catalog-edit-props.props.filterProperties.name")}
					description={t("forms.catalog-edit-props.props.filterProperties.description")}
					control={({ field }) => (
						<MultiSelect
							keepOpenOnSelect
							searchPlaceholder={t("find2")}
							value={field.value?.map((value) => ({
								value,
								label: value,
							}))}
							placeholder={t("forms.catalog-edit-props.props.filterProperties.placeholder")}
							loadOptions={async () => ({
								options:
									properties
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

			<FormField
				name="syntax"
				title={t("forms.catalog-extended-edit-props.props.syntax.name")}
				description={t("forms.catalog-extended-edit-props.props.syntax.description")}
				control={({ field }) => (
					<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
						<SelectTrigger data-qa={FORM_DATA_QA.SYNTAX}>
							<SelectValue
								placeholder={t("forms.catalog-extended-edit-props.props.syntax.placeholder")}
							/>
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
		</>
	);
};
