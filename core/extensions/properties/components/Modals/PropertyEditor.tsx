import useLucideIconLists from "@components/Atoms/Icon/lucideIconList";
import Style from "@components/HomePage/Cards/model/Style";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Values } from "@ext/properties/components/Helpers/Values";
import ActionWarning from "@ext/properties/components/Modals/ActionWarning";
import PropertyService from "@ext/properties/components/PropertyService";
import { Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, IconButton } from "@ui-kit/Button";
import { ErrorState } from "@ui-kit/ErrorState";
import { Form, FormField, FormFieldSet, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { FieldLabel } from "@ui-kit/Label";
import { LazySearchSelect } from "@ui-kit/LazySearchSelect";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { Loader } from "@ui-kit/Loader";
import UnsavedChangesModal from "@components/UnsavedChangesModal";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface PropertyEditorProps<T = Property> {
	data: Property;
	properties: PropertyValue[];
	onDelete?: (archive?: boolean) => Promise<void> | void;
	onSubmit: (values: T) => Promise<void> | void;
	onClose?: () => void;
}

interface FormFieldValuesProps {
	values: string[];
	onChange: (values: string[]) => void;
	error: string;
}

const BetweenContainer = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
`;

const CustomFormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	width: 100%;
`;

const CustomFormFieldLabel = styled(FieldLabel)`
	height: auto;

	.truncate {
		width: 100%;
	}
`;

const TreeRoot = styled.div`
	margin-top: 0.5rem;
	font-size: 0.85rem;
`;

const FormFieldValues = ({ values = [], onChange, error }: FormFieldValuesProps) => {
	const addValue = () => {
		onChange([...values, ""]);
	};

	return (
		<CustomFormField>
			<CustomFormFieldLabel>
				<BetweenContainer>
					<span>{t("forms.catalog-create-props.props.values.name")}</span>
					<IconButton
						icon="plus"
						variant="outline"
						type="button"
						onClick={addValue}
						size="xs"
						className="rounded-full"
						data-qa="qa-add-value"
					/>
				</BetweenContainer>
			</CustomFormFieldLabel>
			<ErrorState className="p-0">{error}</ErrorState>
			<TreeRoot className="tree-root">
				<Values data={values} onChange={onChange} />
			</TreeRoot>
		</CustomFormField>
	);
};

const PropertyEditor = ({ onSubmit, onClose, data, onDelete }: PropertyEditorProps) => {
	const [open, setOpen] = useState(true);
	const [alertOpen, setAlertOpen] = useState(false);

	const [isDeleteLoading, setIsDeleteLoading] = useState(false);
	const [isSubmitLoading, setIsSubmitLoading] = useState(false);

	const isNew = !data?.name;
	const lucideIconListForUikitOptions = useLucideIconLists().lucideIconListForUikitOptions;
	const { properties } = PropertyService.value;

	const schema = z.object({
		name: z
			.string({ message: t("must-be-not-empty") })
			.refine(
				(val) => {
					const newValue = val.trim();
					return newValue.length > 0;
				},
				{ message: t("must-be-not-empty") },
			)
			.refine((val) => !isNew || !properties.has(val), { message: t("properties.already-exist") })
			.transform((val) => val.trim()),
		type: z.enum(Object.values(PropertyTypes) as [string, ...string[]], {
			message: t("must-be-not-empty"),
		}),
		options: z
			.object({
				docportalVisible: z.boolean().optional(),
			})
			.optional(),
		style: z.enum(Object.values(Style) as [string, ...string[]]).optional(),
		icon: z.string().optional(),
		values: z.array(z.string()).optional(),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: data?.name,
			type: data?.type,
			options: data?.options,
			style: data?.style,
			icon: data?.icon,
			values: data?.values,
		},
		mode: "onChange",
	});

	const formSubmit = useCallback(
		(e) => {
			form.handleSubmit(async (data) => {
				setIsSubmitLoading(true);
				const val = data.options;
				const newValues = Object.entries(val || {}).reduce((acc, [key, value]) => {
					if (value) acc[key] = value;

					return acc;
				}, {});

				const newData = {
					...data,
					options: Object.keys(newValues).length > 0 ? newValues : undefined,
				};

				await onSubmit(newData as unknown as Property);
				setIsSubmitLoading(false);
			})(e);
		},
		[form, onSubmit],
	);

	const onDeleteClick = useCallback(
		async (isArchive?: boolean) => {
			setIsDeleteLoading(true);
			await onDelete?.(isArchive);
			setIsDeleteLoading(false);
		},
		[onDelete],
	);

	const isDirty = form.formState.isDirty;

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (isSubmitLoading || isDeleteLoading) return;
			if (isDirty) return setAlertOpen(true);

			setOpen(open);
			if (!open) onClose?.();
		},
		[onClose, isDirty, isSubmitLoading, isDeleteLoading],
	);

	const onChangeValues = useCallback(
		(values: string[]) => {
			form.setValue("values", values, { shouldDirty: true });
		},
		[form],
	);

	const toggleDocportalVisible = useCallback(
		(value: boolean) => {
			form.setValue("options.docportalVisible", value);
		},
		[form],
	);

	const type = form.watch("type");

	return (
		<>
			<Modal open={open} onOpenChange={onOpenChange}>
				<ModalContent data-modal-root>
					<Form asChild {...form}>
						<form className="contents ui-kit" onSubmit={formSubmit}>
							<FormHeader
								icon="tag"
								title={
									isNew ? t("forms.catalog-create-props.name") : t("forms.catalog-create-props.name2")
								}
								description={
									isNew
										? t("forms.catalog-create-props.description")
										: t("forms.catalog-create-props.description2")
								}
							/>
							<ModalBody>
								<FormStack>
									<FormField
										name="name"
										required
										readonly={!isNew}
										title={t("forms.catalog-create-props.props.name.name")}
										control={({ field }) => (
											<Input
												{...field}
												readOnly={!!data?.name}
												placeholder={t("forms.catalog-create-props.props.name.placeholder")}
											/>
										)}
									/>
									<FormField
										name="type"
										required
										readonly={!isNew}
										title={t("forms.catalog-create-props.props.type.name")}
										control={({ field }) => (
											<Select
												disabled={!!data?.name}
												onValueChange={field.onChange}
												defaultValue={field.value || undefined}
											>
												<SelectTrigger
													data-qa={t("forms.catalog-create-props.props.name.name")}
												>
													<SelectValue
														placeholder={t(
															"forms.catalog-create-props.props.type.placeholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{Object.values(PropertyTypes).map((type) => (
														<SelectItem key={type} value={type}>
															{t(`properties.types.${type}`)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									<FormField
										name="icon"
										title={t("forms.catalog-create-props.props.icon.name")}
										description={t("forms.catalog-create-props.props.icon.description")}
										control={({ field }) => (
											<LazySearchSelect
												{...field}
												onChange={field.onChange}
												pageSize={25}
												value={field.value || undefined}
												defaultValue={field.value || undefined}
												filter={(value: string, search: string) => {
													return multiLayoutSearcher<number>({
														sync: true,
														searcher: (search: string): number => {
															if (!search) return 0;
															if (value.toLowerCase().includes(search.toLowerCase()))
																return 2;
															return 0;
														},
													})(search);
												}}
												placeholder={t("forms.catalog-create-props.props.icon.placeholder")}
												options={lucideIconListForUikitOptions}
												renderOption={({ option }) => (
													<div className="flex items-center gap-2">
														<Icon icon={option.value as string} />
														{option.value}
													</div>
												)}
											/>
										)}
									/>
									<FormField
										name="style"
										title={t("forms.catalog-create-props.props.style.name")}
										description={t("forms.catalog-create-props.props.style.description")}
										control={({ field }) => (
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value || undefined}
											>
												<SelectTrigger
													data-qa={t("forms.catalog-create-props.props.style.name")}
												>
													<SelectValue
														placeholder={t(
															"forms.catalog-create-props.props.style.placeholder",
														)}
													/>
												</SelectTrigger>
												<SelectContent>
													{Object.values(Style).map((style) => (
														<SelectItem key={style} value={style}>
															{t(`catalog.style.${style}`)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									/>
									{(type === PropertyTypes.enum || type === PropertyTypes.many) && (
										<FormFieldSet style={{ padding: "1rem" }}>
											<FormFieldValues
												values={form.watch("values")}
												onChange={onChangeValues}
												error={form.formState.errors.values?.message}
											/>
										</FormFieldSet>
									)}
								</FormStack>
							</ModalBody>
							<FormFooter
								leftContent={
									<div className="flex items-center gap-2">
										<SwitchField
											size="sm"
											label={t("properties.options.docportalVisible.name")}
											checked={form.watch("options.docportalVisible")}
											onCheckedChange={toggleDocportalVisible}
										/>
										<Tooltip>
											<TooltipTrigger>
												<Icon icon="info" size="md" className="text-primary-fg" />
											</TooltipTrigger>
											<TooltipContent>
												{t("properties.options.docportalVisible.description")}
											</TooltipContent>
										</Tooltip>
									</div>
								}
								primaryButton={
									<Button type="submit" disabled={isSubmitLoading || isDeleteLoading}>
										<>
											{isSubmitLoading && (
												<>
													<Loader className="p-0 text-inverse-primary-fg" size="sm" />
													{t("loading")}
												</>
											)}
											{!isSubmitLoading && t(isNew ? "add" : "save")}
										</>
									</Button>
								}
								secondaryButton={
									data?.name && (
										<ActionWarning
											shouldShowWarning
											isCatalog
											action={onDeleteClick}
											data={data}
											editData={data}
										>
											<Button
												type="button"
												variant="outline"
												disabled={isDeleteLoading || isSubmitLoading}
											>
												<>
													{isDeleteLoading && (
														<>
															<Loader className="p-0 text-inverse-primary-fg" size="sm" />
															{t("loading")}
														</>
													)}
													{!isDeleteLoading && t("delete")}
												</>
											</Button>
										</ActionWarning>
									)
								}
							/>
						</form>
					</Form>
				</ModalContent>
			</Modal>

			<UnsavedChangesModal
				isOpen={alertOpen}
				onOpenChange={setAlertOpen}
				onSave={() => formSubmit(new Event("submit"))}
				onDontSave={onClose}
			/>
		</>
	);
};

export default PropertyEditor;
