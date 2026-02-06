import { SelectDisableItem } from "@ext/enterprise/components/admin/settings/components/SelectDisableItem";
import { TriggerAddButtonTemplate } from "@ext/enterprise/components/admin/settings/components/TriggerAddButtonTemplate";
import { ModalComponent } from "@ext/enterprise/components/admin/ui-kit/ModalComponent";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface BranchToolbarAddBtnProps {
	onAdd: (branches: string[]) => void;
	branches: string[];
	existingBranches: string[];
}

const createFormSchema = () =>
	z.object({
		selectedBranches: z.array(
			z.object({
				value: z.string(),
				label: z.string(),
				disabled: z.boolean().optional(),
			}),
		),
	});

export const BranchToolbarAddBtn = ({ onAdd, branches, existingBranches }: BranchToolbarAddBtnProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const formSchema = createFormSchema();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			selectedBranches: [],
		},
	});

	const onSubmit = (values: z.infer<typeof formSchema>) => {
		const branchValues = values.selectedBranches.map((branch) => String(branch.value));
		onAdd(branchValues);
		handleCancel();
	};

	const handleCancel = () => {
		form.reset();
		setIsModalOpen(false);
	};

	const loadOptions = async ({ searchQuery }: { searchQuery: string }) => {
		const filteredOptions = branches
			.filter((branch) => branch.includes(searchQuery))
			.map((branch) => ({
				value: branch,
				label: branch,
				disabled: existingBranches.includes(branch),
			}));
		return { options: filteredOptions };
	};

	const cancelButtonProps = useMemo(() => ({ variant: "outline", onClick: handleCancel }) as ButtonProps, []);
	const confirmButtonProps = useMemo(
		() =>
			({
				onClick: form.handleSubmit(onSubmit),
				disabled: !form.watch("selectedBranches").length,
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
										loadOptions={loadOptions}
										onChange={field.onChange}
										placeholder="Найдите ветки"
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
										searchPlaceholder="Введите название ветки"
										value={field.value}
									/>
								)}
								description="Выберите ветки для добавления в список"
								layout="vertical"
								name="selectedBranches"
								title="Ветки"
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title="Выберите ветки"
			trigger={<TriggerAddButtonTemplate />}
		/>
	);
};
