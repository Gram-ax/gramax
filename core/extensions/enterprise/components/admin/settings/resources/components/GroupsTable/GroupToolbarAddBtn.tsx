import { GroupSelectItem } from "@ext/enterprise/components/admin/settings/components/GroupSelectItem";
import {
	REPOSITORY_GROUPS_ROLES,
	type RoleId,
} from "@ext/enterprise/components/admin/settings/components/roles/Access";
import { TriggerAddButtonTemplate } from "@ext/enterprise/components/admin/settings/components/TriggerAddButtonTemplate";
import { type GroupSelectOption, useGroups } from "@ext/enterprise/components/admin/settings/components/useGroups";
import type { Group } from "@ext/enterprise/components/admin/settings/workspace/components/access/components/group/types/GroupTypes";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import type { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { MultiSelect } from "@ui-kit/MultiSelect";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
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
	onAdd: (groups: Group[], role: RoleId) => void;
	groups: Group[];
	existingGroups: string[];
}

export const GroupAndRoleToolbarAddBtn = ({
	disable,
	onAdd,
	groups,
	existingGroups,
}: GroupAndRoleToolbarAddBtnProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedOptions, setSelectedOptions] = useState<GroupSelectOption[]>([]);
	const { hasGroups, loadOptions, resolveSelectedGroups } = useGroups({ groups, existingGroups });

	const formSchema = createFormSchema();
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			groups: [],
			role: "reader",
		},
	});

	const handleGroupsChange = (options: SearchSelectOption[]) => {
		const groupOptions = options as GroupSelectOption[];
		setSelectedOptions(groupOptions);
		const groupValues = groupOptions.map((option) => String(option.value));
		form.setValue("groups", groupValues);
	};

	const handleAddSelectedGroups = form.handleSubmit((values) => {
		if (values.groups.length > 0) {
			onAdd(resolveSelectedGroups(selectedOptions), values.role);
			setSelectedOptions([]);
			form.reset();
			setIsModalOpen(false);
		}
	});

	const closeModal = useCallback(() => {
		setSelectedOptions([]);
		form.reset();
		setIsModalOpen(false);
	}, [form]);

	const handleOpenChange = useCallback(
		(open: boolean) => {
			if (!open) {
				closeModal();
				return;
			}
			setIsModalOpen(true);
		},
		[closeModal],
	);

	const cancelButtonProps = useMemo(
		() =>
			({
				variant: "outline",
				onClick: closeModal,
			}) as ButtonProps,
		[closeModal],
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
										loadMode={hasGroups ? "auto" : undefined}
										loadOptions={loadOptions}
										onChange={handleGroupsChange}
										placeholder={t("enterprise.admin.resources.groups.select")}
										renderOption={(props: RenderOptionProps<GroupSelectOption>) => {
											if (props.type === "trigger") return;
											return (
												<GroupSelectItem
													isDisabled={props.option.disabled}
													isSelected={props.isSelected}
													option={props.option}
												/>
											);
										}}
										searchPlaceholder={t("enterprise.admin.resources.groups.search-placeholder")}
										value={field.value?.map((value) => ({ value, label: value })) || []}
									/>
								)}
								description={t("enterprise.admin.resources.groups.select-groups")}
								layout="vertical"
								name="groups"
								title={t("enterprise.admin.resources.groups.group")}
							/>
							<FormField
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
								description={t("enterprise.admin.roles.select")}
								layout="vertical"
								name="role"
								title={t("enterprise.admin.roles.role")}
							/>
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={handleOpenChange}
			title={t("enterprise.admin.resources.groups.select")}
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
		/>
	);
};
