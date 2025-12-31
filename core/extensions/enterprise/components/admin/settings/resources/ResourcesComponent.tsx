import { useAdminNavigation } from "@ext/enterprise/components/admin/contexts/AdminNavigationContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import ResourceComponent from "@ext/enterprise/components/admin/settings/resources/components/Resource/ResourceComponent";
import { ConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/ConfirmationDialog";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { FormFooter } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FloatingAlert } from "../../ui-kit/FloatingAlert";
import { TabErrorBlock } from "../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../ui-kit/TabInitialLoader";
import { ResourcesTable } from "./components/ResourcesTable";
import { ResourcesSettings } from "./types/ResourcesComponent";

export default function ResourcesComponent() {
	const { settings, addResource, deleteResources, ensureResourcesLoaded, getTabError, isInitialLoading } =
		useSettings();
	const { pageParams, navigate } = useAdminNavigation(Page.RESOURCES);
	const groupId = pageParams?.groupId;
	const repositoryId = pageParams?.repositoryId;
	const resourcesSettings = settings?.resources;

	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string>();
	const [isAddingMode, setIsAddingMode] = useState(false);
	const [localSettings, setLocalSettings] = useState(resourcesSettings);
	const [editedRepository, setEditedRepository] = useState<ResourcesSettings>();
	const [openedRepository, setOpenedRepository] = useState<ResourcesSettings>();
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

	const tabError = getTabError("resources");

	const hasChanges = useMemo(() => {
		if (!editedRepository) return false;
		if (isAddingMode) return Boolean(editedRepository.id);
		return JSON.stringify(editedRepository) !== JSON.stringify(openedRepository);
	}, [editedRepository, openedRepository, isAddingMode]);

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	useEffect(() => {
		setLocalSettings(resourcesSettings);
	}, [resourcesSettings]);

	useEffect(() => {
		if (groupId === "new") {
			setIsAddingMode(true);
			return;
		}
		if (groupId && repositoryId) {
			setIsAddingMode(false);
			handleOpenRepository(`${groupId}/${repositoryId}`);
			return;
		}
		setIsAddingMode(false);
		handleOpenRepository(null);
	}, [groupId, repositoryId]);

	useEffect(() => {
		if (isAddingMode && groupId !== "new") {
			navigate(Page.RESOURCES, { groupId: "new" });
		}
	}, [isAddingMode]);

	const resetState = () => {
		setIsAddingMode(false);
		setEditedRepository(undefined);
		setOpenedRepository(undefined);
	};

	const handleDeleteSelected = async (selectedIds: string[]) => {
		setIsSaving(true);
		try {
			await deleteResources(selectedIds);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleSave = async () => {
		if (!editedRepository?.id) return;
		if (isAddingMode) {
			await proceedAdd(editedRepository);
			setIsAddingMode(false);
			const [g, r] = editedRepository.id.split("/");
			if (g && r) {
				navigate(Page.RESOURCES, { groupId: g, repositoryId: r });
			} else {
				navigate(Page.RESOURCES);
			}
			return;
		}
		await proceedAdd(editedRepository);
		resetState();
		navigate(Page.RESOURCES);
	};

	const proceedAdd = async (resource: ResourcesSettings) => {
		setIsSaving(true);
		try {
			await addResource(resource);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleOpenRepository = (repoId: string | null) => {
		const openedRepository = localSettings?.find((item) => item.id === repoId);
		setEditedRepository(openedRepository);
		setOpenedRepository(openedRepository);
		navigate(Page.RESOURCES);
		if (repoId) {
			const parts = repoId.split("/");
			const repository = parts.pop() || "";
			const group = parts.join("/");
			navigate(Page.RESOURCES, { groupId: group, repositoryId: repository });
		} else {
			navigate(Page.RESOURCES, { groupId: undefined, repositoryId: undefined });
		}
	};

	const handleAdd = () => {
		setIsAddingMode(true);
		handleOpenRepository("");
	};

	const closeResourceDialog = useCallback(() => {
		resetState();
		navigate(Page.RESOURCES);
	}, []);

	const handleClose = useCallback(() => {
		if (hasChanges) {
			setShowUnsavedDialog(true);
			return;
		}
		closeResourceDialog();
	}, [hasChanges, closeResourceDialog]);

	if (isInitialLoading("resources")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureResourcesLoaded(true)} />;
	}

	return (
		<div className="p-6">
			<ResourcesTable
				items={localSettings}
				disabled={isSaving}
				onRowClick={handleOpenRepository}
				onDeleteSelected={handleDeleteSelected}
				onAdd={handleAdd}
			/>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />

			<SheetComponent
				isOpen={Boolean(openedRepository) || isAddingMode}
				onOpenChange={(open) => !open && handleClose()}
				title={
					isAddingMode
						? t("enterprise.admin.resources.add-repository")
						: `${t("enterprise.admin.resources.repository")} ${openedRepository?.id}`
				}
				sheetContent={
					<>
						<ResourceComponent
							isAddingMode={isAddingMode}
							resourceSettings={editedRepository}
							resourcesSettings={localSettings}
							onChange={setEditedRepository}
						/>
						<FormFooter
							primaryButton={
								<>
									{isSaving ? (
										<LoadingButtonTemplate text={`${t("save2")}...`} />
									) : (
										<Button onClick={handleSave} disabled={!hasChanges || isSaving}>
											<Icon icon="save" />
											{t("save")}
										</Button>
									)}
								</>
							}
							secondaryButton={
								<Button variant="outline" onClick={handleClose}>
									{t("cancel")}
								</Button>
							}
						/>
					</>
				}
			/>
			<ConfirmationDialog
				isOpen={showUnsavedDialog}
				onOpenChange={setShowUnsavedDialog}
				onSave={handleSave}
				onClose={closeResourceDialog}
			/>
		</div>
	);
}
