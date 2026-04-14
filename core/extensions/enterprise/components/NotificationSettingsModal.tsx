import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import type { GroupsSettings } from "@ext/enterprise/components/admin/settings/groups/types/GroupsComponentTypes";
import EnterpriseApi from "@ext/enterprise/EnterpriseApi";
import EnterpriseService from "@ext/enterprise/EnterpriseService";
import type { ArticleNotificationSettings } from "@ext/enterprise/notifications/types";
import { NotificationState } from "@ext/enterprise/notifications/types";
import { getEnterpriseSourceData } from "@ext/enterprise/utils/getEnterpriseSourceData";
import t from "@ext/localization/locale/translate";
import { traced } from "@ext/loggers/opentelemetry";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Field } from "@ui-kit/Field";
import { Form, FormSectionTitle, FormStack } from "@ui-kit/Form";
import { Label } from "@ui-kit/Label";
import { MultiSelect } from "@ui-kit/MultiSelect";
import { RadioGroup, RadioGroupItem } from "@ui-kit/RadioGroup";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "ics-ui-kit/components/dialog";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface NotificationSettingsModalProps {
	initialIsOpen?: boolean;
	onClose?: () => void;
	itemRefPath: string;
}

const formSchema = z.object({
	state: z.string(),
	groups: z.array(
		z.object({
			value: z.union([z.string(), z.number()]),
			label: z.string(),
		}),
	),
	users: z.array(
		z.object({
			value: z.union([z.string(), z.number()]),
			label: z.string(),
		}),
	),
});

const NotificationSettingsModal = ({ initialIsOpen = true, onClose, itemRefPath }: NotificationSettingsModalProps) => {
	const gesUrl = PageDataContextService.value.conf.enterprise?.gesUrl;
	const enterpriseSource = getEnterpriseSourceData(SourceDataService.value, gesUrl);
	const token = enterpriseSource?.token;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const [enterpriseService] = useState(() => new EnterpriseService(gesUrl));
	const [enterpriseApi] = useState(() => new EnterpriseApi(gesUrl));
	const [allGroups, setAllGroups] = useState<GroupsSettings | null>(null);
	const [notifications, setNotifications] = useState<ArticleNotificationSettings | null>(null);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			state: NotificationState.OnCreate,
			groups: [],
			users: [],
		},
	});

	useEffect(() => {
		const fetchNotifications = async () => {
			const response = await FetchService.fetch(apiUrlCreator.getNotifications(itemRefPath));
			if (!response.ok) return;
			const data = (await response.json()) as ArticleNotificationSettings | null;
			setNotifications(data);
			if (data) {
				form.reset({
					state: data.state || NotificationState.OnCreate,
					groups: form.getValues("groups"),
					users: data.users?.map((email) => ({ value: email, label: email })) || [],
				});
			}
		};
		void fetchNotifications();
	}, [apiUrlCreator, itemRefPath, form]);

	useEffect(() => {
		if (!token || !gesUrl) return;

		const loadGroups = async () => {
			try {
				const result = await traced("NotificationSettingsModal.loadGroups", () =>
					enterpriseService.getGroupsConfig(token),
				);
				if (result.data) {
					setAllGroups(result.data);

					if (notifications?.groups && Array.isArray(notifications.groups)) {
						const initialGroups = notifications.groups
							.map((groupId) => {
								const groupData = result.data[groupId];
								if (groupData) {
									return {
										value: groupId,
										label: groupData.name || groupId,
									};
								}
								return null;
							})
							.filter(Boolean) as SearchSelectOption[];
						form.setValue("groups", initialGroups);
					}
				}
			} catch {}
		};

		void loadGroups();
	}, [token, gesUrl, enterpriseService, notifications, form]);

	const loadGroupOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			if (!allGroups) return { options: [] };

			const filteredGroups = Object.entries(allGroups).filter(([, groupData]) =>
				groupData.name.toLowerCase().includes(searchQuery.toLowerCase()),
			);

			return {
				options: filteredGroups.map(([id, groupData]) => ({
					value: id,
					label: groupData.name || id,
				})),
			};
		},
		[allGroups],
	);

	const loadUserOptions = useCallback(
		async ({ searchQuery }: { searchQuery: string }) => {
			if (!token || !searchQuery?.trim()) return { options: [] };
			try {
				const users = await traced("NotificationSettingsModal.loadUserOptions", () =>
					enterpriseApi.getUsers(searchQuery, token),
				);
				return {
					options: users.map((user) => ({
						value: user.email,
						label: `${user.email}${user.name ? ` (${user.name})` : ""}`.trim(),
					})),
				};
			} catch {
				return { options: [] };
			}
		},
		[token, enterpriseApi],
	);

	const handleOpenChange = (open: boolean) => {
		if (!open) {
			onClose?.();
		}
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		const groupIds = values.groups.map((g) => g.value);
		const userEmails = values.users.map((u) => u.value);

		await FetchService.fetch(
			apiUrlCreator.updateNotifications(itemRefPath),
			JSON.stringify({
				state: values.state,
				groups: groupIds,
				users: userEmails,
			}),
			MimeTypes.json,
		);

		onClose?.();
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={initialIsOpen}>
			<DialogContent overlayBlur={false} overlayType="default" style={{ maxWidth: "600px" }}>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<DialogHeader className="flex flex-col gap-1.5 border-b-0 pb-0 lg:pb-0">
							<DialogTitle>{t("notifications.settings")}</DialogTitle>
						</DialogHeader>
						<DialogBody>
							<FormStack className="gap-2">
								<FormSectionTitle>{t("notifications.title")}</FormSectionTitle>
								<RadioGroup
									className="mt-0"
									onValueChange={(value) => form.setValue("state", value)}
									value={form.watch("state")}
								>
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="on-create" value={NotificationState.OnCreate} />
										<Label htmlFor="on-create">{t("notifications.on-create")}</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="on-change" value={NotificationState.OnChange} />
										<Label htmlFor="on-change">{t("notifications.on-change")}</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="on-both" value={NotificationState.OnBoth} />
										<Label htmlFor="on-both">{t("notifications.on-both")}</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem id="disabled" value={NotificationState.Disabled} />
										<Label htmlFor="disabled">{t("notifications.disabled")}</Label>
									</div>
								</RadioGroup>

								<FormSectionTitle className="mt-2">{t("notifications.mailing-list")}</FormSectionTitle>
								<Field
									control={() => (
										<MultiSelect
											emptyText={t("enterprise.admin.resources.groups.not-found")}
											errorText={t("enterprise.admin.resources.groups.error-search")}
											loadOptions={loadGroupOptions}
											onChange={(value) =>
												form.setValue("groups", value as z.infer<typeof formSchema>["groups"])
											}
											placeholder={t("notifications.mailing-list-select-groups")}
											value={form.watch("groups") as SearchSelectOption[]}
										/>
									)}
									layout="vertical"
									title={t("notifications.mailing-list-groups")}
								/>
								<Field
									control={() => (
										<MultiSelect
											emptyText={t("enterprise.admin.search.users.emptyText")}
											errorText={t("enterprise.admin.search.users.errorText")}
											loadMode="input"
											loadOptions={loadUserOptions}
											minInputLength={1}
											onChange={(value) =>
												form.setValue("users", value as z.infer<typeof formSchema>["users"])
											}
											placeholder={t("notifications.mailing-list-search-users")}
											searchPlaceholder={t("find2")}
											value={form.watch("users") as SearchSelectOption[]}
										/>
									)}
									layout="vertical"
									title={t("notifications.mailing-list-users")}
								/>
							</FormStack>
						</DialogBody>
						<DialogFooter className="border-t-0 pt-0 lg:pt-0 flex justify-end gap-2">
							<DialogClose asChild>
								<Button type="button" variant="outline">
									{t("cancel")}
								</Button>
							</DialogClose>
							<Button type="submit">{t("save")}</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default NotificationSettingsModal;
