import { SelectDisableItem } from "@ext/enterprise/components/admin/settings/components/SelectDisableItem";
import { TriggerAddButtonTemplate } from "@ext/enterprise/components/admin/settings/components/TriggerAddButtonTemplate";
import { ModalComponent } from "@ext/enterprise/components/admin/ui-kit/ModalComponent";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createFormSchema = () =>
	z.object({
		repositories: z.array(z.string()),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface RepositoryToolbarAddBtnProps {
	disable: boolean;
	onAdd: (repositories: string[]) => void;
	repositories: string[];
	existingRepositories: string[];
}

export const RepositoryToolbarAddBtn = ({
	disable,
	onAdd,
	repositories,
	existingRepositories,
}: RepositoryToolbarAddBtnProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const formSchema = createFormSchema();
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			repositories: [],
		},
	});

	const loadOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			const filteredRepositories = repositories.filter((repo) =>
				repo.toLowerCase().includes(searchQuery.toLowerCase()),
			);

			return {
				options: filteredRepositories.map((repo) => ({
					value: repo,
					label: repo,
					disabled: existingRepositories.includes(repo),
				})),
			};
		},
		[repositories, existingRepositories],
	);

	const handleRepositoriesChange = (options: SearchSelectOption[]) => {
		const repositoryValues = options.map((option) => String(option.value));
		form.setValue("repositories", repositoryValues);
	};

	const handleAddSelectedRepositories = form.handleSubmit((values) => {
		if (values.repositories.length > 0) {
			onAdd(values.repositories);
			form.reset();
			setIsModalOpen(false);
		}
	});

	const cancelButtonProps = useMemo(
		() =>
			({
				variant: "outline",
				onClick: () => {
					form.reset();
					setIsModalOpen(false);
				},
			}) as ButtonProps,
		[form],
	);

	const confirmButtonProps = useMemo(
		() =>
			({
				type: "submit",
				onClick: handleAddSelectedRepositories,
				disabled: !form.watch("repositories").length || disable,
			}) as ButtonProps,
		[form, disable, handleAddSelectedRepositories],
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
										emptyText="Репозитории не найдены"
										errorText="Ошибка поиска"
										loadOptions={loadOptions}
										onChange={handleRepositoriesChange}
										placeholder="Выберите репозитории"
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
										value={field.value?.map((value) => ({ value, label: value })) || []}
									/>
								)}
								description="Выберите репозитории для добавления"
								layout="vertical"
								name="repositories"
								title="Репозитории"
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title="Выберите репозитории"
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
		/>
	);
};
