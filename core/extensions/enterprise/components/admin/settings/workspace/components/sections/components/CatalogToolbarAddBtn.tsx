import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import type { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ModalComponent } from "../../../../../ui-kit/ModalComponent";
import { SelectDisableItem } from "../../../../components/SelectDisableItem";

interface CatalogToolbarAddBtnProps {
	onAdd: (catalogs: string[]) => void;
	existingCatalogs?: string[];
	catalogs: string[];
}

const createFormSchema = () =>
	z.object({
		selectedCatalogs: z.array(
			z.object({
				value: z.string(),
				label: z.string(),
				disabled: z.boolean().optional(),
			}),
		),
	});

export const CatalogToolbarAddBtn = ({ onAdd, existingCatalogs = [], catalogs }: CatalogToolbarAddBtnProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const formSchema = createFormSchema();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			selectedCatalogs: [],
		},
	});

	const loadOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			const filteredCatalogs = catalogs
				.filter((catalog) => catalog.toLowerCase().includes(searchQuery.toLowerCase()))
				.map((catalog) => ({
					value: catalog,
					label: catalog,
					disabled: existingCatalogs.includes(catalog),
				}));

			return { options: filteredCatalogs };
		},
		[catalogs, existingCatalogs],
	);

	const handleCancel = useCallback(() => {
		form.reset();
		setIsModalOpen(false);
	}, [form.reset]);

	const onSubmit = useCallback(
		(values: z.infer<typeof formSchema>) => {
			const catalogsToAdd = values.selectedCatalogs.map((catalog) => String(catalog.value));
			onAdd(catalogsToAdd);
			handleCancel();
		},
		[handleCancel, onAdd],
	);

	const cancelButtonProps = useMemo(
		() => ({ variant: "outline", onClick: handleCancel }) as ButtonProps,
		[handleCancel],
	);
	const confirmButtonProps = useMemo(
		() =>
			({
				onClick: form.handleSubmit(onSubmit),
				disabled: !form.watch("selectedCatalogs").length,
			}) as ButtonProps,
		[form, onSubmit],
	);

	return (
		<ModalComponent
			cancelButtonProps={cancelButtonProps}
			cancelButtonText={t("enterprise.admin.cancel")}
			confirmButtonProps={confirmButtonProps}
			confirmButtonText={t("add")}
			isOpen={isModalOpen}
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								control={({ field }) => (
									<MultiSelect
										emptyText={t("enterprise.admin.workspace.sections.add-catalogs.empty")}
										errorText={t("enterprise.admin.search-error")}
										loadingText={t("enterprise.admin.workspace.sections.add-catalogs.loading")}
										loadOptions={loadOptions}
										onChange={field.onChange}
										placeholder={t("enterprise.admin.workspace.sections.add-catalogs.title")}
										renderOption={(props: RenderOptionProps<SearchSelectOption>) => {
											if (props.type === "trigger") return;
											return (
												<SelectDisableItem
													isDisabled={props.option.disabled}
													isSelected={props.isSelected}
													text={props.option.label}
												/>
											);
										}}
										searchPlaceholder={t("enterprise.admin.search")}
										value={field.value}
									/>
								)}
								description={t("enterprise.admin.workspace.sections.add-catalogs.description")}
								layout="vertical"
								name="selectedCatalogs"
								title={t("enterprise.admin.workspace.sections.dialog.catalogs")}
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title={t("enterprise.admin.workspace.sections.add-catalogs.title")}
			trigger={<AddButton />}
		/>
	);
};
