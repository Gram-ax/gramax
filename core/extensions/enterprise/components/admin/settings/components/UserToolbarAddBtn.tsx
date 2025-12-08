import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { RenderOptionProps } from "@ui-kit/AsyncSearchSelect";
import { ButtonProps } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { Input } from "@ui-kit/Input";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ModalComponent } from "../../ui-kit/ModalComponent";
import { SelectDisableItem } from "./SelectDisableItem";
import { TriggerAddButtonTemplate } from "./TriggerAddButtonTemplate";

const createFormSchema = (existingUsers: string[]) =>
	z.object({
		users: z.array(z.string()).refine((users) => {
			return !users.some((user) => existingUsers.includes(user));
		}, t("enterprise.admin.resources.users.already-exist")),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

interface UserToolbarAddBtnProps {
	disable?: boolean;
	onAdd: (users: string[]) => void;
	existingUsers?: string[];
	limit?: number;
}

export const UserToolbarAddBtn = ({ disable, onAdd, existingUsers = [], limit }: UserToolbarAddBtnProps) => {
	const { hasUsers, searchUsers } = useSettings();

	const [isModalOpen, setIsModalOpen] = useState(false);

	const formSchema = createFormSchema(existingUsers);
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			users: [],
		},
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
					label: `${user.email} (${user.name})`,
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

	const handleAddSelectedUsers = form.handleSubmit((values) => {
		if (values.users.length > 0) {
			onAdd(values.users);
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
				onClick: handleAddSelectedUsers,
				disabled: !form.watch("users").length || disable,
			} as ButtonProps),
		[form, disable, handleAddSelectedUsers],
	);

	return (
		<ModalComponent
			isOpen={isModalOpen}
			onOpenChange={setIsModalOpen}
			trigger={<TriggerAddButtonTemplate disabled={disable} />}
			title={t("enterprise.admin.search.users.title")}
			description={
				availableSlots
					? t("enterprise.admin.search.users.description").replace("{count}", availableSlots.toString())
					: ""
			}
			modalContent={
				<Form asChild {...form}>
					<form className="contents">
						<FormStack>
							<FormField
								name="users"
								title={t("enterprise.admin.users.users")}
								layout="vertical"
								description={t("enterprise.admin.users.add-select")}
								control={({ field }) =>
									hasUsers ? (
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
											loadMode="input"
											minInputLength={1}
											placeholder={t("enterprise.admin.search.users.placeholder")}
											searchPlaceholder={t("enterprise.admin.search.users.searchPlaceholder")}
											inputHintText={t("enterprise.admin.search.users.inputHintText")}
											loadingText={t("enterprise.admin.search.users.loadingText")}
											emptyText={t("enterprise.admin.search.users.emptyText")}
											errorText={t("enterprise.admin.search.users.errorText")}
											value={field.value?.map((value) => ({ value, label: value })) || []}
											onChange={handleUsersChange}
										/>
									) : (
										<Input
											{...field}
											placeholder={t("enterprise.admin.search.users.placeholder")}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(value ? [value] : []);
											}}
										/>
									)
								}
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
