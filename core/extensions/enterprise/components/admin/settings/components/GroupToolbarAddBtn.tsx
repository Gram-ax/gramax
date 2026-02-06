import { GroupInfo } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ModalComponent } from "../../ui-kit/ModalComponent";
import { SelectDisableItem } from "./SelectDisableItem";
import { TriggerAddButtonTemplate } from "./TriggerAddButtonTemplate";

const createFormSchema = () =>
	z.object({
		groups: z.array(z.string()),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface GroupToolbarAddBtnProps {
	disable?: boolean;
	onAdd: (groups: string[]) => void;
	groups: GroupInfo[];
	existingGroups: string[];
}

export const GroupToolbarAddBtn = ({ disable, onAdd, groups, existingGroups }: GroupToolbarAddBtnProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const formSchema = createFormSchema();
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			groups: [],
		},
	});

	const loadOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			const filteredGroups = groups.filter((group) =>
				group.name.toLowerCase().includes(searchQuery.toLowerCase()),
			);

			return {
				options: filteredGroups.map((group) => ({
					value: group.id,
					label: group.name,
					disabled: existingGroups.includes(group.id),
				})),
			};
		},
		[groups, existingGroups],
	);

	const handleGroupsChange = (options: SearchSelectOption[]) => {
		const groupValues = options.map((option) => String(option.value));
		form.setValue("groups", groupValues);
	};

	const handleAddSelectedGroups = form.handleSubmit((values) => {
		if (values.groups.length > 0) {
			onAdd(values.groups);
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
				onClick: handleAddSelectedGroups,
				disabled: !form.watch("groups").length || disable,
			}) as ButtonProps,
		[form, disable, handleAddSelectedGroups],
	);

	return (
		<ModalComponent
			cancelButtonProps={cancelButtonProps}
			cancelButtonText={t("cancel")}
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
										emptyText={t("enterprise.admin.resources.groups.not-found")}
										errorText={t("enterprise.admin.resources.groups.error-search")}
										loadOptions={loadOptions}
										onChange={handleGroupsChange}
										placeholder={t("enterprise.admin.resources.groups.select-groups")}
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
								description={t("enterprise.admin.resources.groups.select-groups")}
								layout="vertical"
								name="groups"
								title={t("enterprise.admin.resources.groups.group")}
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title={t("enterprise.admin.resources.groups.select")}
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
		/>
	);
};
