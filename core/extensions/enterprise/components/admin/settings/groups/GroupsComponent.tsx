import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { ConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/ConfirmationDialog";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Form, FormField } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { TextInput } from "@ui-kit/Input";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GroupValue } from "../components/roles/Access";
import { GroupsTable } from "./components/GroupsTable";
import { GroupsUserTable } from "./components/GroupsUserTable";

const createFormSchema = (
	groupSettings: Record<string, { name: string; members: GroupValue[] }> | undefined,
	editingGroup: string | null,
	editingGroupOriginalName: string | null,
) =>
	z.object({
		groupName: z
			.string()
			.min(1, t("enterprise.admin.groups.name-error"))
			.refine((name) => {
				if (!groupSettings) return true;
				if (editingGroup && name.trim() === editingGroupOriginalName) return true;
				const nameExists = Object.values(groupSettings).some((g) => g.name === name.trim());
				return !nameExists;
			}, t("enterprise.admin.groups.group-name-exists")),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

const GroupsComponent = () => {
	const {
		settings,
		addGroup,
		updateGroup,
		renameGroup,
		ensureGroupsLoaded,
		deleteGroups,
		getTabError,
		isInitialLoading,
	} = useSettings();
	const groupSettings = settings?.groups;
	const { pageParams, navigate } = useAdminNavigation(Page.USER_GROUPS);

	const entityId = pageParams?.entityId;

	const [isEditing, setIsEditing] = useState(false);
	const [editingGroup, setEditingGroup] = useState<string | null>(null);
	const [editingGroupOriginalName, setEditingGroupOriginalName] = useState<string | null>(null);
	const [groupUsers, setGroupUsers] = useState<GroupValue[]>([]);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const formSchema = createFormSchema(groupSettings, editingGroup, editingGroupOriginalName);
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
		defaultValues: {
			groupName: "",
		},
	});

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	const handleSave = form.handleSubmit(async (values) => {
		if (!groupSettings) return;

		if (editingGroup) {
			const originalGroup = groupSettings[editingGroup];
			const nameChanged = values.groupName.trim() !== editingGroupOriginalName;
			const membersChanged = JSON.stringify(originalGroup?.members) !== JSON.stringify(groupUsers);

			if (nameChanged && membersChanged) {
				await proceedUpdate(editingGroup, groupUsers, values.groupName.trim());
			} else if (nameChanged) {
				await proceedRename(editingGroup, values.groupName.trim());
			} else if (membersChanged) {
				await proceedUpdate(editingGroup, groupUsers, originalGroup.name);
			}
		} else {
			await proceedAdd(values.groupName.trim(), groupUsers);
		}

		resetForm();
		navigate(Page.USER_GROUPS, { entityId: "" });
	});

	const proceedAdd = async (groupName: string, groupValue: GroupValue[]) => {
		setIsSaving(true);
		try {
			await addGroup({ groupId: groupName, groupValue, groupName });
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const proceedRename = async (groupId: string, newName: string) => {
		setIsSaving(true);
		try {
			await renameGroup(groupId, newName);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const proceedUpdate = async (groupId: string, groupValue: GroupValue[], groupName: string) => {
		setIsSaving(true);
		try {
			await updateGroup(groupId, groupValue, groupName);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const proceedDelete = async (groupIds: string[]) => {
		setIsSaving(true);
		try {
			await deleteGroups(groupIds);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const resetForm = () => {
		setIsEditing(false);
		setEditingGroup(null);
		setEditingGroupOriginalName(null);
		form.reset();
		setGroupUsers([]);
	};

	const handleClose = () => {
		if (hasChanges) {
			setShowUnsavedDialog(true);
			return;
		}
		resetForm();
		navigate(Page.USER_GROUPS, { entityId: "" });
	};

	const groupName = form.watch("groupName");
	const hasChanges = useMemo(() => {
		if (!groupSettings) return false;
		if (editingGroup) {
			const originalGroup = groupSettings[editingGroup];
			const nameChanged = groupName !== originalGroup?.name;
			const membersChanged = JSON.stringify(originalGroup?.members) !== JSON.stringify(groupUsers);
			return nameChanged || membersChanged;
		}
		return groupName?.trim() !== "" || groupUsers.length > 0;
	}, [groupSettings, editingGroup, groupName, groupUsers]);

	useEffect(() => {
		if (entityId) {
			setIsEditing(true);
			if (entityId === "new") {
				setEditingGroup(null);
				setEditingGroupOriginalName(null);
				form.reset({ groupName: "" });
				setGroupUsers([]);
			} else {
				const groupData = groupSettings?.[entityId];
				setEditingGroup(entityId);
				setEditingGroupOriginalName(groupData?.name ?? entityId);
				form.reset({ groupName: groupData?.name ?? entityId });
				setGroupUsers(groupData?.members ?? []);
			}
		} else {
			setIsEditing(false);
		}
	}, [entityId, groupSettings, form]);

	const tabError = getTabError("groups");

	if (isInitialLoading("groups")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureGroupsLoaded(true)} />;
	}

	if (!groupSettings) return null;

	return (
		<div className="p-6">
			<div>
				<GroupsTable onDelete={proceedDelete} />
			</div>

			<FloatingAlert show={Boolean(saveError)} message={saveError} />

			<SheetComponent
				isOpen={isEditing}
				onOpenChange={(open) => !open && handleClose()}
				title={
					editingGroup
						? editingGroupOriginalName
							? `${t("enterprise.admin.groups.group")} ${editingGroupOriginalName}`
							: t("enterprise.admin.groups.group")
						: t("enterprise.admin.groups.add-group")
				}
				sheetContent={
					<Form asChild {...form}>
						<form className="contents">
							<div className="flex flex-col">
								<FormField
									name="groupName"
									title={t("enterprise.admin.groups.group-name")}
									layout="vertical"
									control={({ field }) => (
										<TextInput
											className="w-[300px] mb-4"
											placeholder={t("enterprise.admin.groups.group-name-placeholder")}
											{...field}
										/>
									)}
								/>
								<GroupsUserTable users={groupUsers} onChange={setGroupUsers} />
							</div>
						</form>
					</Form>
				}
				confirmButton={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button onClick={handleSave} disabled={!form.formState.isValid || !hasChanges}>
								<Icon icon="save" />
								{t("save")}
							</Button>
						)}
					</>
				}
			/>

			<ConfirmationDialog
				isOpen={showUnsavedDialog}
				onOpenChange={setShowUnsavedDialog}
				onSave={handleSave}
				onClose={resetForm}
			/>
		</div>
	);
};

export default GroupsComponent;
