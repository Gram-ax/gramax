import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { usePreventAutoFocusToInput } from "@ui-kit/Dialog/utils";
import { FormField } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { TagInput } from "@ui-kit/TagInput";
import type { UseFormReturn } from "react-hook-form";
import { FORM_DATA_QA, FORM_STYLES } from "../../consts/form";
import { useFormSelectValues } from "../../hooks/useFormSelectValues";
import type { FormData, FormProps } from "../../logic/createFormSchema";

export type BasicProps = {
	formProps: FormProps;
	form: UseFormReturn<FormData>;
};

export const EditBasicProps = ({ formProps, form }: BasicProps) => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { inputRef } = usePreventAutoFocusToInput(true);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);
	const { languages, syntaxes } = useFormSelectValues();

	return (
		<>
			<FormField
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.TITLE}
						placeholder={t("forms.catalog-edit-props.props.title.placeholder")}
						{...field}
						ref={inputRef}
					/>
				)}
				description={t("forms.catalog-edit-props.props.title.description")}
				name="title"
				required
				title={t("forms.catalog-edit-props.props.title.name")}
				{...formProps}
			/>
			<FormField
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.URL}
						placeholder={t("forms.catalog-edit-props.props.url.placeholder")}
						{...field}
						readOnly={!!sourceType}
					/>
				)}
				description={t("forms.catalog-edit-props.props.url.description")}
				name="url"
				title={t("forms.catalog-edit-props.props.url.name")}
				{...formProps}
			/>

			<FormField
				control={({ field }) => (
					<Input
						data-qa={FORM_DATA_QA.DOCROOT}
						placeholder={t("forms.catalog-edit-props.props.docroot.placeholder")}
						{...field}
					/>
				)}
				description={t("forms.catalog-edit-props.props.docroot.description")}
				name="docroot"
				title={t("forms.catalog-edit-props.props.docroot.name")}
				{...formProps}
			/>

			<FormField
				control={({ field }) => (
					<Select
						defaultValue={field.value || undefined}
						disabled={!!form.formState.defaultValues?.language}
						onValueChange={field.onChange}
					>
						<SelectTrigger data-qa={FORM_DATA_QA.LANGUAGE}>
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
				name="language"
				title={t("forms.catalog-edit-props.props.language.name")}
				{...formProps}
			/>

			<FormField
				control={({ field }) => (
					<TagInput
						onChange={(values) => field.onChange(values)}
						placeholder={t("forms.catalog-edit-props.props.versions.placeholder")}
						value={field.value || []}
					/>
				)}
				description={t("forms.catalog-edit-props.props.versions.description")}
				name="versions"
				title={t("forms.catalog-edit-props.props.versions.name")}
				{...formProps}
			/>

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
				name="syntax"
				title={t("forms.catalog-extended-edit-props.props.syntax.name")}
			/>
		</>
	);
};
