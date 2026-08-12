import { SelectDisableItem } from "@ext/enterprise/components/admin/settings/components/SelectDisableItem";
import { AddButton } from "@ext/enterprise/components/admin/ui-kit/AddButton";
import { ModalComponent } from "@ext/enterprise/components/admin/ui-kit/ModalComponent";
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
										emptyText={t("enterprise.admin.workspace.repositories.add.empty")}
										errorText={t("enterprise.admin.search-error")}
										loadOptions={loadOptions}
										onChange={handleRepositoriesChange}
										placeholder={t("enterprise.admin.workspace.repositories.add.title")}
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
										value={field.value?.map((value) => ({ value, label: value })) || []}
									/>
								)}
								description={t("enterprise.admin.workspace.repositories.add.description")}
								layout="vertical"
								name="repositories"
								title={t("enterprise.admin.workspace.repositories.add.label")}
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title={t("enterprise.admin.workspace.repositories.add.title")}
			trigger={<AddButton disabled={disable} />}
		/>
	);
};
