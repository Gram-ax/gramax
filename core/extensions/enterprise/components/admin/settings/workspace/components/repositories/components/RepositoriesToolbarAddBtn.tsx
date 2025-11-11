import { SelectDisableItem } from "@ext/enterprise/components/admin/settings/components/SelectDisableItem";
import { TriggerAddButtonTemplate } from "@ext/enterprise/components/admin/settings/components/TriggerAddButtonTemplate";
import { ModalComponent } from "@ext/enterprise/components/admin/ui-kit/ModalComponent";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createFormSchema = () => z.object({
	repositories: z.array(z.string())
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
			repositories: []
		}
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
		const repositoryValues = options.map(option => String(option.value));
		form.setValue("repositories", repositoryValues);
	};

	const handleAddSelectedRepositories = form.handleSubmit((values) => {
		if (values.repositories.length > 0) {
			onAdd(values.repositories);
			form.reset();
			setIsModalOpen(false);
		}
	});

	const cancelButtonProps = useMemo(() => ({ 
		variant: "outline", 
		onClick: () => {
			form.reset();
			setIsModalOpen(false);
		}
	} as ButtonProps), [form]);
	
	const confirmButtonProps = useMemo(
		() =>
			({
				type: "submit",
				onClick: handleAddSelectedRepositories,
				disabled: !form.watch("repositories").length || disable,
			} as ButtonProps),
		[form, disable, handleAddSelectedRepositories],
	);

	return (
		<ModalComponent
			isOpen={isModalOpen}
			onOpenChange={setIsModalOpen}
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
			title="Выберите репозитории"
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								name="repositories"
								title="Репозитории"
								layout="vertical"
								description="Выберите репозитории для добавления"
								control={({ field }) => (
									<MultiSelect
										loadOptions={loadOptions}
										value={field.value?.map(value => ({ value, label: value })) || []}
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
										onChange={handleRepositoriesChange}
										placeholder="Выберите репозитории"
										emptyText="Репозитории не найдены"
										errorText="Ошибка поиска"
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
