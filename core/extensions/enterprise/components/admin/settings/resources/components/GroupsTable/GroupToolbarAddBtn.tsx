import { REPOSITORY_GROUPS_ROLES, RoleId } from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { SelectDisableItem } from "@ext/enterprise/components/admin/settings/components/SelectDisableItem";
import { TriggerAddButtonTemplate } from "@ext/enterprise/components/admin/settings/components/TriggerAddButtonTemplate";
import { GroupInfo } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ModalComponent } from "../../../../ui-kit/ModalComponent";

const createFormSchema = () =>
	z.object({
		groups: z.array(z.string()),
		role: z.enum(REPOSITORY_GROUPS_ROLES),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface GroupAndRoleToolbarAddBtnProps {
	disable?: boolean;
	onAdd: (groups: string[], role: RoleId) => void;
	groups: GroupInfo[];
	existingGroups: string[];
}

export const GroupAndRoleToolbarAddBtn = ({
	disable,
	onAdd,
	groups,
	existingGroups,
}: GroupAndRoleToolbarAddBtnProps) => {
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
			onAdd(values.groups, values.role);
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
		} as ButtonProps),
		[form],
	);

	const confirmButtonProps = useMemo(
		() =>
		({
			type: "submit",
			onClick: handleAddSelectedGroups,
			disabled: !form.watch("groups").length || disable,
		} as ButtonProps),
		[form, disable, handleAddSelectedGroups],
	);

	return (
		<ModalComponent
			isOpen={isModalOpen}
			onOpenChange={setIsModalOpen}
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
			title={t("enterprise.admin.resources.groups.select")}
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								name="groups"
								title={t("enterprise.admin.resources.groups.group")}
								layout="vertical"
								description={t("enterprise.admin.resources.groups.select-groups")}
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
										value={field.value?.map((value) => ({ value, label: value })) || []}
										onChange={handleGroupsChange}
										placeholder={t("enterprise.admin.resources.groups.select")}
										emptyText={t("enterprise.admin.resources.groups.not-found")}
										errorText={t("enterprise.admin.resources.groups.error-search")}
									/>
								)}
							/>
							<FormField
								name="role"
								title={t("enterprise.admin.roles.role")}
								layout="vertical"
								description={t("enterprise.admin.roles.select")}
								control={({ field }) => (
									<Select {...field} onValueChange={field.onChange}>
										<SelectTrigger>
											<SelectValue placeholder={t("enterprise.admin.roles.select")} />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{REPOSITORY_GROUPS_ROLES.map((role) => (
													<SelectItem key={role} value={role}>
														{t(`enterprise.admin.roles.${role}`)}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								)}
							/>
						</FormStack>
					</form>
				</Form>
			}
			confirmButtonText={t("add")}
			cancelButtonText={t("cancel")}
			cancelButtonProps={cancelButtonProps}
			confirmButtonProps={confirmButtonProps}
		/>
	);
};
