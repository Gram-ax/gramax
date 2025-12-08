import { useAdminPageData } from "@ext/enterprise/components/admin/contexts/AdminPageDataContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { ConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/ConfirmationDialog";
import { FloatingAlert } from "@ext/enterprise/components/admin/ui-kit/FloatingAlert";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { TabErrorBlock } from "@ext/enterprise/components/admin/ui-kit/TabErrorBlock";
import { TabInitialLoader } from "@ext/enterprise/components/admin/ui-kit/TabInitialLoader";
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
import { shallow } from "zustand/shallow";

const createFormSchema = (groupSettings: Record<string, GroupValue[]> | undefined, editingGroup: string | null) =>
	z.object({
		groupName: z
			.string()
			.min(1, t("enterprise.admin.groups.name-error"))
			.refine((name) => {
				if (!groupSettings || editingGroup) return true;
				return !Object.prototype.hasOwnProperty.call(groupSettings, name.trim());
			}, t("enterprise.admin.groups.group-name-exists")),
	});

type FormData = z.infer<ReturnType<typeof createFormSchema>>;

const GroupsComponent = () => {
	const { settings, addGroup, ensureGroupsLoaded, deleteGroups, getTabError, isInitialLoading } = useSettings();
	const groupSettings = settings?.groups;
	const { setParams, params } = useAdminPageData(
		(store) => ({
			setParams: store.setParams,
			params: store.params,
		}),
		shallow,
	);

	const { entityId } = params;

	const [isEditing, setIsEditing] = useState(false);
	const [editingGroup, setEditingGroup] = useState<string | null>(null);
	const [groupUsers, setGroupUsers] = useState<GroupValue[]>([]);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const formSchema = createFormSchema(groupSettings, editingGroup);
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
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

		await proceedAdd(values.groupName, groupUsers);

		resetForm();
		setParams({ tabId: "", entityId: "", groupId: "", repositoryId: "" });
	});

	const proceedAdd = async (groupId: string, groupValue: GroupValue[]) => {
		setIsSaving(true);
		try {
			await addGroup({ groupId, groupValue });
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
		form.reset();
		setGroupUsers([]);
	};

	const handleClose = () => {
		if (hasChanges) {
			setShowUnsavedDialog(true);
			return;
		}
		resetForm();
		setParams({ tabId: "", entityId: "", groupId: "", repositoryId: "" });
	};

	const hasChanges = useMemo(() => {
		if (!groupSettings) return false;
		const groupName = form.watch("groupName");
		if (editingGroup) {
			return JSON.stringify(groupSettings[editingGroup]) !== JSON.stringify(groupUsers);
		}
		return groupName?.trim() !== "";
	}, [groupSettings, editingGroup, form, groupUsers]);

	useEffect(() => {
		if (entityId) {
			setIsEditing(true);
			if (entityId === "new") {
				setEditingGroup(null);
				form.reset({ groupName: "" });
				setGroupUsers([]);
			} else {
				setEditingGroup(entityId);
				form.reset({ groupName: entityId });
				setGroupUsers(groupSettings?.[entityId] ?? []);
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
		<>
			<div>
				<GroupsTable onDelete={proceedDelete} />
			</div>

			<FloatingAlert show={Boolean(saveError)} message={saveError} />

			<SheetComponent
				isOpen={isEditing}
				onOpenChange={(open) => !open && handleClose()}
				title={editingGroup ? editingGroup : t("enterprise.admin.groups.add-group")}
				sheetContent={
					<Form asChild {...form}>
						<form className="contents">
							<div className="flex flex-col gap-4">
								{!editingGroup && (
									<FormField
										name="groupName"
										title={t("enterprise.admin.groups.group-name")}
										layout="vertical"
										description={t("enterprise.admin.groups.group-name-description")}
										control={({ field }) => (
											<TextInput
												className="w-[300px]"
												placeholder={t("enterprise.admin.groups.group-name-placeholder")}
												{...field}
											/>
										)}
									/>
								)}
								{form.watch("groupName") && (
									<GroupsUserTable users={groupUsers} onChange={setGroupUsers} />
								)}
							</div>
						</form>
					</Form>
				}
				confirmButton={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button onClick={handleSave}>
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
		</>
	);
};

export default GroupsComponent;
