import { Property, PropertyTypes, PropertyValue } from "@ext/properties/models";
import { Form, FormField, FormFooter, FormHeader, FormStack } from "@ui-kit/Form";
import { FieldLabel } from "@ui-kit/Label";
import { Modal, ModalBody, ModalContent } from "@ui-kit/Modal";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import t from "@ext/localization/locale/translate";
import Style from "@components/HomePage/Cards/model/Style";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { Input } from "ics-ui-kit/components/input";
import { lucideIconListForUikitOptions } from "@components/Atoms/Icon/lucideIconList";
import { LazySearchSelect } from "@ui-kit/LazySearchSelect";
import Icon from "@components/Atoms/Icon";
import multiLayoutSearcher from "@core-ui/languageConverter/multiLayoutSearcher";
import { DndProvider } from "react-dnd";
import ValueHandler from "@ext/properties/components/Helpers/ValueHandler";
import ModifiedBackend, { useDragDrop } from "@ext/navigation/catalog/drag/logic/ModifiedBackend";
import { Button, IconButton } from "@ui-kit/Button";
import styled from "@emotion/styled";
import { ErrorState } from "@ui-kit/ErrorState";
import ActionWarning from "@ext/properties/components/Modals/ActionWarning";

export interface PropertyEditorProps<T = Property> {
	data: Property;
	properties: PropertyValue[];
	onDelete?: (archive?: boolean) => void;
	onSubmit: (values: T) => void;
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
	width: 100%;
`;

const CustomFormFieldLabel = styled(FieldLabel)`
	.truncate {
		width: 100%;
	}
`;

const TreeRoot = styled.div`
	margin-top: 0.5rem;
	font-size: 0.85rem;
`;

const FormFieldValues = ({ values = [], onChange, error }: FormFieldValuesProps) => {
	const { backend } = useDragDrop();

	const addValue = () => {
		onChange([...values, ""]);
	};

	return (
		<CustomFormField>
			<CustomFormFieldLabel>
				<BetweenContainer>
					<span>{t("forms.catalog-create-props.props.values.name")}</span>
					<IconButton
						variant="text"
						type="button"
						icon="plus"
						onClick={addValue}
						size="xs"
						data-qa="qa-add-value"
					/>
				</BetweenContainer>
			</CustomFormFieldLabel>
			<ErrorState>{error}</ErrorState>
			<DndProvider backend={(manager) => ModifiedBackend(backend(manager))}>
				<TreeRoot className="tree-root">
					<ValueHandler data={values} onChange={onChange} />
				</TreeRoot>
			</DndProvider>
		</CustomFormField>
	);
};

const PropertyEditor = ({ onSubmit, onClose, data, onDelete }: PropertyEditorProps) => {
	const [open, setOpen] = useState(true);
	const isNew = !data?.name;

	const schema = z.object({
		name: z
			.string()
			.min(1, { message: t("must-be-not-empty") })
			.transform((val) => val.trim()),
		type: z.enum(Object.values(PropertyTypes) as [string, ...string[]], {
			message: t("must-be-not-empty"),
		}),
		style: z.enum(Object.values(Style) as [string, ...string[]]).optional(),
		icon: z.string().optional(),
		values: z.array(z.string()).optional(),
	});

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: data?.name,
			type: data?.type,
			style: data?.style,
			icon: data?.icon,
			values: data?.values,
		},
		mode: "onChange",
	});

	const formSubmit = (e) => {
		form.handleSubmit((data) => onSubmit(data as unknown as Property))(e);
	};

	const onOpenChange = (open: boolean) => {
		setOpen(open);
		if (!open) onClose?.();
	};

	const onChangeValues = (values: string[]) => {
		form.setValue("values", values, { shouldDirty: true });
	};

	const type = form.watch("type");

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent data-modal-root>
				<Form asChild {...form}>
					<form className="contents ui-kit" onSubmit={formSubmit}>
						<FormHeader
							icon="tag"
							title={isNew ? t("forms.catalog-create-props.name") : t("forms.catalog-create-props.name2")}
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
											<SelectTrigger data-qa={t("forms.catalog-create-props.props.name.name")}>
												<SelectValue
													placeholder={t("forms.catalog-create-props.props.type.placeholder")}
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
												return multiLayoutSearcher((search: string): number => {
													if (!search) return 0;
													if (value.toLowerCase().includes(search.toLowerCase())) return 2;
													return 0;
												}, true)(search);
											}}
											placeholder={t("forms.catalog-create-props.props.icon.placeholder")}
											options={lucideIconListForUikitOptions}
											renderOption={({ option }) => (
												<span>
													<Icon
														code={option.value as string}
														style={{ fontSize: "1.25rem" }}
														strokeWidth={1}
													/>
													<span>{option.value}</span>
												</span>
											)}
										/>
									)}
								/>
								<FormField
									name="style"
									title={t("forms.catalog-create-props.props.style.name")}
									description={t("forms.catalog-create-props.props.style.description")}
									control={({ field }) => (
										<Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
											<SelectTrigger data-qa={t("forms.catalog-create-props.props.style.name")}>
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
									<FormFieldValues
										values={form.watch("values")}
										onChange={onChangeValues}
										error={form.formState.errors.values?.message}
									/>
								)}
							</FormStack>
						</ModalBody>
						<FormFooter
							primaryButton={<Button type="submit">{t(isNew ? "add" : "save")}</Button>}
							secondaryButton={
								data?.name && (
									<ActionWarning
										shouldShowWarning
										isCatalog
										action={(isArchive) => onDelete?.(isArchive)}
										data={data}
										editData={data}
									>
										<Button type="button" variant="outline">
											{t("delete")}
										</Button>
									</ActionWarning>
								)
							}
						/>
					</form>
				</Form>
			</ModalContent>
		</Modal>
	);
};

export default PropertyEditor;
