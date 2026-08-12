import Style from "@components/HomePage/Cards/model/Style";
import UnsavedChangesModal from "@components/UnsavedChangesModal";
import generateUniqueID from "@core/utils/generateUniqueID";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { PopoverIconPicker } from "@ext/markdown/elements/icon/edit/components/IconPicker/PopoverIconPicker";
import { Values } from "@ext/properties/components/Helpers/Values";
import ActionWarning from "@ext/properties/components/Modals/ActionWarning";
import PropertyService from "@ext/properties/components/PropertyService";
import { PropertyStylePicker } from "@ext/properties/components/PropertyStylePicker";
import { isPropertySuitableForArticle, type Property, PropertyTypes, type PropertyValue } from "@ext/properties/models";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, IconButton, InlineTriggerButton } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { ErrorState } from "@ui-kit/ErrorState";
import { Form, FormField, FormFieldSet, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { Input } from "@ui-kit/Input";
import { Loader } from "@ui-kit/Loader";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface PropertyEditorProps<T = Property> {
	data: Property;
	properties: PropertyValue[];
	onlyArticlePropertyTypes?: boolean;
	onDelete?: (archive?: boolean) => Promise<void> | void;
	onSubmit: (values: T) => Promise<void> | void;
	onClose?: () => void;
}

interface FormFieldValuesProps {
	values: string[];
	onChange: (values: string[]) => void;
	error: string;
}

const FormFieldValues = ({ values = [], onChange, error }: FormFieldValuesProps) => {
	const addValue = () => {
		onChange([...values, ""]);
	};

	return (
		<div className="flex flex-col gap-1 w-full overflow-hidden">
			<div className="flex items-center justify-between w-full">
				<span>{t("forms.catalog-create-props.props.values.name")}</span>
				<IconButton
					className="rounded-full"
					data-testid="add-value"
					icon="plus"
					onClick={addValue}
					size="xs"
					type="button"
					variant="outline"
				/>
			</div>
			<ErrorState className="p-0">{error}</ErrorState>
			<div className="tree-root mt-2 text-[0.85rem] overflow-auto max-h-96">
				<Values data={values} onChange={onChange} />
			</div>
		</div>
	);
};

const PropertyEditor = ({
	onSubmit,
	onClose,
	data,
	onDelete,
	onlyArticlePropertyTypes: onlyArticleProperties,
}: PropertyEditorProps) => {
	const [open, setOpen] = useState(true);
	const [alertOpen, setAlertOpen] = useState(false);

	const [isDeleteLoading, setIsDeleteLoading] = useState(false);
	const [isSubmitLoading, setIsSubmitLoading] = useState(false);

	const isNew = !data?.id;
	const { properties } = PropertyService.value;

	const propertyTypes = onlyArticleProperties
		? Object.values(PropertyTypes).filter(isPropertySuitableForArticle)
		: Object.values(PropertyTypes);

	const schema = z.object({
		id: z.string().optional(),
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
		type: z.enum(propertyTypes as [string, ...string[]], {
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
			id: data?.id,
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
			void form.handleSubmit(async (data) => {
				setIsSubmitLoading(true);
				const val = data.options;
				const newValues = Object.entries(val || {}).reduce((acc, [key, value]) => {
					if (value) acc[key] = value;

					return acc;
				}, {});

				const newData = {
					...data,
					id: data.id || generateUniqueID(5),
					options: Object.keys(newValues).length > 0 ? newValues : undefined,
				};

				try {
					await onSubmit(newData as unknown as Property);
					setOpen(false);
				} finally {
					setIsSubmitLoading(false);
				}
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
			<Dialog onOpenChange={onOpenChange} open={open}>
				<DialogContent data-modal-root>
					<Form asChild {...form}>
						<form className="contents ui-kit" onSubmit={formSubmit}>
							<FormHeader
								description={
									isNew
										? t("forms.catalog-create-props.description")
										: t("forms.catalog-create-props.description2")
								}
								icon="tag"
								title={
									isNew ? t("forms.catalog-create-props.name") : t("forms.catalog-create-props.name2")
								}
							/>
							<DialogBody>
								<FormStack>
									<FormField
										control={({ field }) => (
											<Input
												{...field}
												placeholder={t("forms.catalog-create-props.props.name.placeholder")}
												readOnly={!!data?.id}
											/>
										)}
										name="name"
										readonly={!isNew}
										required
										title={t("forms.catalog-create-props.props.name.name")}
									/>
									<FormField
										control={({ field }) => (
											<Select
												defaultValue={field.value || undefined}
												disabled={!!data?.id}
												onValueChange={field.onChange}
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
													{propertyTypes.map((type) => (
														<SelectItem key={type} value={type}>
															{t(`properties.types.${type}`)}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
										name="type"
										readonly={!isNew}
										required
										title={t("forms.catalog-create-props.props.type.name")}
									/>
									<FormField
										control={({ field }) => (
											<PopoverIconPicker
												disable={["emoji", "file-input", "color"]}
												label={field.value ? field.value : t("icon")}
												onChange={(value) => "code" in value && field.onChange(value.code)}
												onClear={() => field.onChange(undefined)}
												value={field.value ? { code: field.value } : undefined}
											/>
										)}
										description={t("forms.catalog-create-props.props.icon.description")}
										name="icon"
										title={t("forms.catalog-create-props.props.icon.name")}
									/>
									<FormField
										control={({ field }) => (
											<Popover>
												<PopoverTriggerButton
													className={cn(
														"w-full justify-start pr-2.5 pl-3 py-1.5 font-normal",
														!field.value && "text-muted",
													)}
													containerClassName="w-full justify-start"
													data-testid="style-popover-trigger"
													variant="outline"
												>
													<Icon icon="palette" />
													{t(
														field.value
															? (`catalog.style.${field.value}` as keyof typeof t)
															: "forms.catalog-edit-props.props.style.placeholder",
													)}
													<div className="flex items-center ml-auto">
														{field.value && (
															<InlineTriggerButton
																className="shrink-0"
																onClick={() => field.onChange(null)}
															/>
														)}
														<Tooltip>
															<TooltipContent>{t("pick-random-value")}</TooltipContent>
															<TooltipTrigger asChild>
																<span>
																	<InlineTriggerButton
																		className="shrink-0"
																		icon="dices"
																		onClick={() => {
																			const randomStyle = Object.values(Style).at(
																				Math.floor(
																					Math.random() *
																						Object.values(Style).length,
																				),
																			);
																			field.onChange(randomStyle);
																		}}
																	/>
																</span>
															</TooltipTrigger>
														</Tooltip>
														<span className="text-muted pl-2 shrink-0 aspect-square inline-flex items-center justify-center">
															<Icon icon="chevron-down" />
														</span>
													</div>
												</PopoverTriggerButton>
												<PopoverContent className="p-0 w-auto rounded-xl">
													<PropertyStylePicker
														onChange={field.onChange}
														value={field.value}
													/>
												</PopoverContent>
											</Popover>
										)}
										description={t("forms.catalog-create-props.props.style.description")}
										name="style"
										title={t("forms.catalog-create-props.props.style.name")}
									/>
									{(type === PropertyTypes.enum || type === PropertyTypes.many) && (
										<FormFieldSet style={{ padding: "1rem" }}>
											<FormFieldValues
												error={form.formState.errors.values?.message}
												onChange={onChangeValues}
												values={form.watch("values")}
											/>
										</FormFieldSet>
									)}
								</FormStack>
							</DialogBody>
							<FormFooter
								leftContent={
									<div className="flex items-center gap-2">
										<CheckboxField
											checked={form.watch("options.docportalVisible")}
											label={t("properties.options.docportalVisible.name")}
											onCheckedChange={toggleDocportalVisible}
										/>
										<Tooltip>
											<TooltipTrigger>
												<Icon className="text-primary-fg" icon="info" size="md" />
											</TooltipTrigger>
											<TooltipContent>
												{t("properties.options.docportalVisible.description")}
											</TooltipContent>
										</Tooltip>
									</div>
								}
								primaryButton={
									<Button disabled={isSubmitLoading || isDeleteLoading} type="submit">
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
									data?.id && (
										<ActionWarning
											action={onDeleteClick}
											data={data}
											editData={data}
											isCatalog
											shouldShowWarning
										>
											<Button
												disabled={isDeleteLoading || isSubmitLoading}
												type="button"
												variant="outline"
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
				</DialogContent>
			</Dialog>

			<UnsavedChangesModal
				isOpen={alertOpen}
				onDontSave={onClose}
				onOpenChange={setAlertOpen}
				onSave={() => formSubmit(new Event("submit"))}
			/>
		</>
	);
};

export default PropertyEditor;
