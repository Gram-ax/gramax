import { ButtonProps } from "@ui-kit/Button";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalComponent } from "../../../../../ui-kit/ModalComponent";
import { TriggerAddButtonTemplate } from "../../../../components/TriggerAddButtonTemplate";
import { SelectDisableItem } from "../../../../components/SelectDisableItem";

interface CatalogToolbarAddBtnProps {
	onAdd: (catalogs: string[]) => void;
	existingCatalogs?: string[];
	catalogs: string[];
}

const createFormSchema = () => z.object({
	selectedCatalogs: z
		.array(z.object({
			value: z.string(),
			label: z.string(),
			disabled: z.boolean().optional()
		}))
});

export const CatalogToolbarAddBtn = ({ onAdd, existingCatalogs = [], catalogs }: CatalogToolbarAddBtnProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	
	const formSchema = createFormSchema();
	
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			selectedCatalogs: []
		}
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
				disabled: !form.watch('selectedCatalogs').length
			}) as ButtonProps,
		[form, onSubmit]
	);

	return (
		<ModalComponent
			isOpen={isModalOpen}
			onOpenChange={setIsModalOpen}
			trigger={<TriggerAddButtonTemplate />}
			title="Выберите каталоги"
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								name="selectedCatalogs"
								title="Каталоги"
								layout="vertical"
								description="Выберите каталоги для добавления в список"
								control={({ field }) => (
									<MultiSelect
										loadOptions={loadOptions}
										renderOption={(props: RenderOptionProps<SearchSelectOption>) => {
											if (props.type === "trigger") return;
											return (
												<SelectDisableItem
													text={props.option.label}
													isDisabled={props.option.disabled}
													isSelected={props.isSelected}
												/>
											);
										}}
										placeholder="Найдите каталоги"
										searchPlaceholder="Введите название каталога"
										loadingText="Ищем каталоги..."
										emptyText="Каталоги не найдены"
										errorText="Ошибка поиска"
										value={field.value}
										onChange={field.onChange}
									/>
								)}
							/>
						</FormStack>
					</form>
				</Form>
			}
			confirmButtonText="Добавить"
			cancelButtonText="Отмена"
			cancelButtonProps={cancelButtonProps}
			confirmButtonProps={confirmButtonProps}
		/>
	);
};
