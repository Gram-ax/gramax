import validateEmail from "@core/utils/validateEmail";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import {
	REPOSITORY_EXTERNAL_USERS_ROLES,
	REPOSITORY_USER_ROLES,
	type RoleId,
} from "@ext/enterprise/components/admin/settings/components/roles/Access";
import type { GuestsSettings } from "@ext/enterprise/components/admin/settings/guests/types/GuestsComponent";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import type { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import type { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { MultiSelect } from "@ui-kit/MultiSelect";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ModalComponent } from "../../../../ui-kit/ModalComponent";
import { SelectDisableItem } from "../../../components/SelectDisableItem";
import { TriggerAddButtonTemplate } from "../../../components/TriggerAddButtonTemplate";

const createFormSchema = (
	inSelectInput: boolean,
	isExternal: boolean,
	existingUsers: string[],
	guests: GuestsSettings,
) =>
	z.object({
		users: inSelectInput
			? z.array(z.string()).refine((users) => {
					return !users.some((user) => existingUsers.includes(user));
				}, t("enterprise.admin.resources.users.already-exist"))
			: z
					.string()
					.transform((user) => user.trim())
					.refine((user) => validateEmail(user), t("enterprise-guest.validationErrors.emailInvalidFormat"))
					.refine(
						(user) => !existingUsers.includes(user),
						t("enterprise.admin.resources.users.already-exist"),
					)
					.refine((user) => {
						if (!isExternal) return true;
						if (!user.includes("@")) return true;
						const domain = user.split("@")[1];
						if (guests.whitelistEnabled) return guests.domains.includes(domain);
						return true;
					}, t("enterprise.admin.guests.domain-not-allowed")),
		role: z.enum(REPOSITORY_USER_ROLES).optional(),
		branches: z.array(z.string()).optional(),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface UserToolbarAddBtnProps {
	disable?: boolean;
	onAdd: (users: string[], role: RoleId, branches: string[]) => void;
	loadBranchesOptions: () => Promise<{ options: SearchSelectOption[] }>;
	existingUsers?: string[];
	isExternal?: boolean;
	limit?: number;
}

export const UserAndRoleToolbarAddBtn = ({
	disable,
	onAdd,
	loadBranchesOptions,
	existingUsers = [],
	isExternal,
	limit,
}: UserToolbarAddBtnProps) => {
	const { hasUsers, searchUsers, settings } = useSettings();
	const [isModalOpen, setIsModalOpen] = useState(false);

	const inSelectInput = hasUsers && !isExternal;
	const formSchema = createFormSchema(inSelectInput, isExternal, existingUsers, settings.guests);
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: { users: [] },
	});

	const currentCount = existingUsers.length;
	const availableSlots = limit && currentCount ? limit - currentCount : undefined;

	const loadOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			if (!hasUsers || !searchUsers) return { options: [] };
			const users = await searchUsers(searchQuery);

			return {
				options: users.map((user) => ({
					value: user.email,
					label: `${user.email} ${user.name ? `(${user.name})` : ""}`.trim(),
					disabled: existingUsers.includes(user.email),
				})),
			};
		},
		[hasUsers, searchUsers, existingUsers],
	);

	const handleUsersChange = (options: SearchSelectOption[]) => {
		const limitedOptions = availableSlots ? options.slice(0, availableSlots) : options;
		const userValues = limitedOptions.map((option) => String(option.value));
		form.setValue("users", userValues);
	};

	const handleBranchesChange = (options: SearchSelectOption[]) => {
		const branchValues = options.map((option) => String(option.value));
		form.setValue("branches", branchValues);
	};

	const handleAddSelectedUsers = form.handleSubmit((values) => {
		if (values.role === "reviewer" && !values.branches?.length) {
			form.setError("branches", { message: t("enterprise.admin.resources.branches.required") });
			return;
		}
		if (values.users.length > 0) {
			if (typeof values.users === "string") {
				onAdd([values.users], REPOSITORY_EXTERNAL_USERS_ROLES[0], values.branches);
			} else {
				onAdd(values.users, values.role, values.branches);
			}
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
				onClick: handleAddSelectedUsers,
				disabled: !form.watch("users").length || disable,
			}) as ButtonProps,
		[form, disable, handleAddSelectedUsers],
	);

	return (
		<ModalComponent
			cancelButtonProps={cancelButtonProps}
			cancelButtonText={t("cancel")}
			confirmButtonProps={confirmButtonProps}
			confirmButtonText={t("add")}
			description={
				availableSlots
					? t("enterprise.admin.search.users.description").replace("{count}", availableSlots.toString())
					: ""
			}
			isOpen={isModalOpen}
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								control={({ field }) =>
									inSelectInput ? (
										<MultiSelect
											emptyText={t("enterprise.admin.search.users.emptyText")}
											errorText={t("enterprise.admin.search.users.errorText")}
											inputHintText={t("enterprise.admin.search.users.inputHintText")}
											loadingText={t("enterprise.admin.search.users.loadingText")}
											loadMode="input"
											loadOptions={loadOptions}
											minInputLength={1}
											onChange={handleUsersChange}
											placeholder={t("enterprise.admin.search.users.placeholder")}
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
											searchPlaceholder={t("enterprise.admin.search.users.searchPlaceholder")}
											value={field.value?.map((value) => ({ value, label: value })) || []}
										/>
									) : (
										<Input
											onChange={(e) => {
												const value = e.target.value;
												!settings.guests.domains.includes(value);
												field.onChange(value ? [value] : []);
											}}
											placeholder={"example@google.com"}
											{...field}
										/>
									)
								}
								description={
									inSelectInput
										? t("enterprise.admin.users.add-select")
										: t("enterprise.admin.users.add")
								}
								layout="vertical"
								name="users"
								title={t("enterprise.admin.users.users")}
							/>
							{inSelectInput && (
								<FormField
									control={({ field }) => (
										<Select {...field} onValueChange={field.onChange}>
											<SelectTrigger>
												<SelectValue placeholder={t("enterprise.admin.roles.select")} />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{REPOSITORY_USER_ROLES.map((role) => (
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
							)}
							{form.watch("role") === "reviewer" && (
								<FormField
									control={({ field }) => (
										<MultiSelect
											emptyText={t("enterprise.admin.resources.branches.emptyText")}
											errorText={t("enterprise.admin.resources.branches.errorText")}
											inputHintText={t("enterprise.admin.resources.branches.inputHintText")}
											loadingText={t("enterprise.admin.resources.branches.loadingText")}
											loadMode="auto"
											loadOptions={loadBranchesOptions}
											minInputLength={1}
											onChange={handleBranchesChange}
											placeholder={t("enterprise.admin.resources.branches.placeholder")}
											searchPlaceholder={t(
												"enterprise.admin.resources.branches.searchPlaceholder",
											)}
											value={field.value?.map((value) => ({ value, label: value })) || []}
										/>
									)}
									description={t("enterprise.admin.resources.branches.select")}
									layout="vertical"
									name="branches"
									title={t("enterprise.admin.resources.branches.branches")}
								/>
							)}
						</FormStack>
					</form>
				</Form>
			}
			onOpenChange={setIsModalOpen}
			title={t("enterprise.admin.search.users.title")}
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
		/>
	);
};
