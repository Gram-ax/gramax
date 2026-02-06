import { zodResolver } from "@hookform/resolvers/zod";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ModalComponent } from "../../../../../ui-kit/ModalComponent";
import { SelectDisableItem } from "../../../../components/SelectDisableItem";
import { TriggerAddButtonTemplate } from "../../../../components/TriggerAddButtonTemplate";

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

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const catalogsToAdd = values.selectedCatalogs.map((catalog) => String(catalog.value));
		onAdd(catalogsToAdd);
		handleCancel();
	};

	const handleCancel = () => {
		form.reset();
		setIsModalOpen(false);
	};

	const cancelButtonProps = useMemo(() => ({ variant: "outline", onClick: handleCancel }) as ButtonProps, []);
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
			cancelButtonText="Отмена"
			confirmButtonProps={confirmButtonProps}
			confirmButtonText="Добавить"
			isOpen={isModalOpen}
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								control={({ field }) => (
									<MultiSelect
										emptyText="Каталоги не найдены"
										errorText="Ошибка поиска"
										loadingText="Ищем каталоги..."
										loadOptions={loadOptions}
										onChange={field.onChange}
										placeholder="Найдите каталоги"
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
										searchPlaceholder="Введите название каталога"
										value={field.value}
									/>
								)}
								description="Выберите каталоги для добавления в список"
								layout="vertical"
								name="selectedCatalogs"
								title="Каталоги"
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title="Выберите каталоги"
			trigger={<TriggerAddButtonTemplate />}
		/>
	);
};
