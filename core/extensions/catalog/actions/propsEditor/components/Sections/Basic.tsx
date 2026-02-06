import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import isSystemProperty from "@ext/properties/logic/isSystemProperty";
import { enumTypes, type Property, PropertyTypes } from "@ext/properties/models";
import getPartGitSourceDataByStorageName from "@ext/storage/logic/utils/getPartSourceDataByStorageName";
import { feature } from "@ext/toggleFeatures/features";
import { FormField } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { usePreventAutoFocusToInput } from "@ui-kit/Modal/utils";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@ui-kit/Select";
import { TagInput } from "@ui-kit/TagInput";
import type { UseFormReturn } from "react-hook-form";
import { FORM_DATA_QA, FORM_STYLES } from "../../consts/form";
import { useFormSelectValues } from "../../hooks/useFormSelectValues";
import type { FormData, FormProps } from "../../logic/createFormSchema";

export type BasicProps = {
	formProps: FormProps;
	form: UseFormReturn<FormData>;
};

const EditCatalogPropertyFilter = ({ properties, formProps }: BasicProps & { properties: Property[] }) => {
	const flags = properties.filter((p) => p.type === PropertyTypes.flag);
	const enums = properties.filter((p) => p.type === PropertyTypes.enum);
	const many = properties.filter((p) => p.type === PropertyTypes.many);

	return (
		<FormField
			{...formProps}
			control={({ field }) => {
				return (
					<Select
						disabled={!properties.length}
						onValueChange={field.onChange}
						value={field.value || undefined}
					>
						<SelectTrigger onClear={() => field.onChange(null)}>
							<SelectValue placeholder={t("forms.catalog-edit-props.props.filterProperty.placeholder")} />
						</SelectTrigger>
						<SelectContent>
							{flags.length > 0 && (
								<SelectGroup>
									<SelectLabel>{t(`properties.types.Flag`)}</SelectLabel>
									{flags.map((p) => (
										<SelectItem key={p.name} value={p.name}>
											<span className="flex  gap-1">
												{p.icon && <Icon icon={p.icon} />}
												{p.name}
											</span>
										</SelectItem>
									))}
								</SelectGroup>
							)}
							{enums.length > 0 && (
								<SelectGroup>
									<SelectLabel>{t(`properties.types.Enum`)}</SelectLabel>
									{enums.map((p) => (
										<SelectItem key={p.name} value={p.name}>
											<span className="flex gap-1">
												{p.icon && <Icon icon={p.icon} />}
												{p.name}
											</span>
										</SelectItem>
									))}
								</SelectGroup>
							)}
							{many.length > 0 && (
								<SelectGroup>
									<SelectLabel>{t(`properties.types.Many`)}</SelectLabel>
									{many.map((p) => (
										<SelectItem key={p.name} value={p.name}>
											<span className="flex gap-1">
												{p.icon && <Icon icon={p.icon} />}
												{p.name}
											</span>
										</SelectItem>
									))}
								</SelectGroup>
							)}
						</SelectContent>
					</Select>
				);
			}}
			description={t("forms.catalog-edit-props.props.filterProperty.description")}
			name="filterProperty"
			title={t("forms.catalog-edit-props.props.filterProperty.name")}
		/>
	);
};

export const EditBasicProps = ({ formProps, form }: BasicProps) => {
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const { inputRef } = usePreventAutoFocusToInput(true);
	const { sourceType } = getPartGitSourceDataByStorageName(sourceName);
	const { languages, syntaxes } = useFormSelectValues();

	const properties = useCatalogPropsStore((state) => state.data?.properties, "shallow").filter(
		(p) => !isSystemProperty(p.name) && (p.type === PropertyTypes.flag || enumTypes.includes(p.type)),
	);

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

			{feature("filtered-catalog") && (
				<EditCatalogPropertyFilter form={form} formProps={formProps} properties={properties} />
			)}

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
