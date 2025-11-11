import { useAdminPageData } from "@ext/enterprise/components/admin/contexts/AdminPageDataContext";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import GroupsTable from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/GroupsTable";
import UsersTable from "@ext/enterprise/components/admin/settings/resources/components/UsersTable/UsersTable";
import { ConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/ConfirmationDialog";
import { SheetComponent } from "@ext/enterprise/components/admin/ui-kit/SheetComponent";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncSearchSelect, LoadOptionsParams, LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import { Button, IconButton, LoadingButtonTemplate } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import { Icon } from "@ui-kit/Icon";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingAlert } from "../../ui-kit/FloatingAlert";
import { TabErrorBlock } from "../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../ui-kit/TabInitialLoader";
import { ResourcesTable } from "./components/ResourcesTable";
import { ResourcesSettings } from "./types/ResourcesComponent";

const createFormSchema = () =>
	z.object({
		repository: z
			.object({
				value: z.string(),
				label: z.string(),
			})
			.optional(),
		mainBranch: z
			.object({
				value: z.string(),
				label: z.string(),
			})
			.optional(),
	});

interface ResourcesComponentProps {
	selectAllResources: string[];
}

export default function ResourcesComponent({ selectAllResources }: ResourcesComponentProps) {
	const {
		settings,
		addResource,
		deleteResources,
		searchBranches,
		ensureResourcesLoaded,
		getTabError,
		isInitialLoading,
	} = useSettings();
	const { params, setPage, setParams } = useAdminPageData();
	const { groupId, repositoryId } = params;
	const resourcesSettings = settings?.resources;
	const [localSettings, setLocalSettings] = useState(resourcesSettings);
	const [openedRepository, setOpenedRepository] = useState<string | null>(null);
	const [editedResource, setEditedResource] = useState<ResourcesSettings | null>(null);
	const [isAddingMode, setIsAddingMode] = useState(false);
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [branches, setBranches] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	const formSchema = createFormSchema();

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	const handleOpenRepository = async (repoId: string | null) => {
		setOpenedRepository(repoId);
		if (repoId) {
			const parts = repoId.split("/");
			const repository = parts.pop() || "";
			const group = parts.join("/");
			setPage(Page.RESOURCES);
			setParams((pr) => ({ ...pr, groupId: group, repositoryId: repository }));
			try {
				const branchesList = await searchBranches(repoId);
				setBranches(branchesList);
			} catch (error) {
				console.error("Ошибка загрузки веток:", error);
			}
		} else {
			setBranches([]);
			setPage(Page.RESOURCES);
			setParams((pr) => ({ ...pr, groupId: "", repositoryId: "" }));
		}
	};

	const availableResources = useMemo(() => {
		if (!selectAllResources) return [];
		if (!localSettings) return selectAllResources;
		return selectAllResources.filter((resource) => !localSettings.some((setting) => setting.id === resource));
	}, [selectAllResources, localSettings]);

	const loadRepoOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			const filteredOptions = availableResources
				.filter((resource) => resource.toLowerCase().includes(searchQuery.toLowerCase()))
				.map((resource) => ({
					value: resource,
					label: resource,
				}));

			return { options: filteredOptions };
		},
		[availableResources],
	);

	const loadBranchOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			const filteredOptions = branches
				.filter((branch) => branch.toLowerCase().includes(searchQuery.toLowerCase()))
				.map((branch) => ({
					value: branch,
					label: branch,
				}));

			return { options: filteredOptions };
		},
		[branches],
	);

	useEffect(() => {
		setLocalSettings(resourcesSettings);
	}, [resourcesSettings]);

	useEffect(() => {
		if (groupId === "new") {
			setOpenedRepository(null);
			setIsAddingMode(true);
			return;
		}
		if (groupId && repositoryId) {
			setIsAddingMode(false);
			void handleOpenRepository(`${groupId}/${repositoryId}`);
			return;
		}
		setIsAddingMode(false);
		void handleOpenRepository(null);
	}, [groupId, repositoryId]);

	useEffect(() => {
		if (isAddingMode && groupId !== "new") {
			setPage(Page.RESOURCES);
			setParams((pr) => ({ ...pr, groupId: "new" }));
		}
	}, [isAddingMode]);

	const handleDeleteSelected = async (selectedIds: string[]) => {
		await proceedDelete(selectedIds);
	};

	const currentRepository = useMemo(() => {
		return localSettings?.find((item) => item.id === openedRepository);
	}, [localSettings, openedRepository]);

	const hasChanges = useMemo(() => {
		if (!editedResource) return false;

		if (isAddingMode) return Boolean(editedResource.id);

		return JSON.stringify(editedResource) !== JSON.stringify(currentRepository);
	}, [editedResource, currentRepository, isAddingMode]);

	useEffect(() => {
		if (currentRepository) {
			setEditedResource(currentRepository);
		}
	}, [currentRepository]);

	useEffect(() => {
		const value = editedResource?.mainBranch
			? { value: editedResource.mainBranch, label: editedResource.mainBranch }
			: undefined;
		form.setValue("mainBranch", value);
	}, [editedResource?.mainBranch]);

	const handleSave = async () => {
		if (!editedResource?.id) return;

		if (isAddingMode) {
			await proceedAdd(editedResource);
			setIsAddingMode(false);
			setOpenedRepository(editedResource.id);
			const [g, r] = editedResource.id.split("/");
			if (g && r) {
				setPage(Page.RESOURCES);
				setParams((pr) => ({ ...pr, groupId: g, repositoryId: r }));
			} else {
				setPage(Page.RESOURCES);
			}
			return;
		}

		await proceedAdd(editedResource);
		resetForm();
		setPage(Page.RESOURCES);
	};

	const onSubmit = () => {
		handleSave();
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

	const proceedDelete = async (resourceIds: string[]) => {
		setIsSaving(true);
		try {
			await deleteResources(resourceIds);
		} catch (e: any) {
			setSaveError(e?.message);
		} finally {
			setIsSaving(false);
		}
	};

	const handleAdd = () => {
		setIsAddingMode(true);
		handleOpenRepository("");
		setEditedResource({
			id: "",
			mainBranch: "",
			access: {
				groups: [],
				users: [],
				externalUsers: [],
			},
		});
	};

	const handleRepoSelect = (option: SearchSelectOption | null) => {
		if (!editedResource || !option) return;

		const value = String(option.value);
		handleOpenRepository(value);
		setEditedResource({
			...editedResource,
			id: value,
		});

		form.setValue("repository", {
			value: String(option.value),
			label: option.label,
		});
	};

	const resetForm = () => {
		setOpenedRepository(null);
		setIsAddingMode(false);
		setEditedResource(null);
		form.reset();
	};

	const handleClose = () => {
		if (hasChanges) {
			setShowUnsavedDialog(true);
			return;
		}
		resetForm();
		setPage(Page.RESOURCES);
	};

	const isRepositoryLocked = useMemo(() => {
		return !isAddingMode && currentRepository;
	}, [isAddingMode, currentRepository]);

	const tabError = getTabError("resources");

	if (isInitialLoading("resources")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureResourcesLoaded(true)} />;
	}

	return (
		<div>
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
						: `${t("enterprise.admin.resources.repository")} ${openedRepository}`
				}
				sheetContent={
					<Form asChild {...form}>
						<form className="contents">
							<FormStack>
								<FloatingAlert show={Boolean(saveError)} message={saveError} />

								{isAddingMode && (
									<div className="flex items-center gap-2 relative z-50 w-full">
										<div className="flex-1 mt-1">
											<FormField
												name="repository"
												title={t("enterprise.admin.resources.repository")}
												layout="vertical"
												description={t(
													"enterprise.admin.resources.select-repository-description",
												)}
												control={({ field }) => (
													<AsyncSearchSelect
														loadOptions={loadRepoOptions}
														value={field.value || undefined}
														placeholder={t(
															"enterprise.admin.resources.select-repository-placeholder",
														)}
														onChange={
															isRepositoryLocked
																? () => {}
																: (option) => {
																		field.onChange(option);
																		handleRepoSelect(option);
																  }
														}
														searchPlaceholder={t(
															"enterprise.admin.resources.search-repository-placeholder",
														)}
														emptyText={t("enterprise.admin.resources.repository-not-found")}
													/>
												)}
											/>
										</div>
									</div>
								)}

								<div className={!editedResource?.id ? "opacity-50 pointer-events-none" : ""}>
									<div className="flex items-center gap-2">
										<div className="flex-1">
											<FormField
												name="mainBranch"
												title={t("enterprise.admin.resources.main-branch")}
												layout="vertical"
												description={t("enterprise.admin.resources.main-branch-description")}
												control={({ field }) => (
													<AsyncSearchSelect
														key={editedResource?.mainBranch}
														loadOptions={loadBranchOptions}
														value={field.value || undefined}
														placeholder={t(
															"enterprise.admin.resources.select-main-branch-placeholder",
														)}
														onChange={(option: SearchSelectOption | null) => {
															field.onChange(option);
															if (!editedResource) return;
															setEditedResource({
																...editedResource,
																mainBranch: String(option?.value || ""),
															});
														}}
														searchPlaceholder={t(
															"enterprise.admin.resources.search-main-branch-placeholder",
														)}
														emptyText={t(
															"enterprise.admin.resources.main-branch-not-found",
														)}
														{...field}
													/>
												)}
											/>
										</div>
										<IconButton
											icon="x"
											variant="ghost"
											disabled={!editedResource?.mainBranch}
											onClick={() => {
												if (!editedResource) return;
												setEditedResource({
													...editedResource,
													mainBranch: "",
												});
												form.setValue("mainBranch", undefined);
											}}
										/>
									</div>
								</div>
								<div className={!editedResource?.id ? "opacity-50 pointer-events-none mt-2" : "mt-2"}>
									<label className="text-primary-fg flex h-4 min-w-0 items-center gap-x-0.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
										<span>{t("enterprise.admin.resources.access")}</span>
									</label>
									<Tabs defaultValue="users">
										<TabsList className="w-full">
											<TabsTrigger value="users" className="flex-1">
												<span className="font-medium">
													{t("enterprise.admin.users.users")}{" "}
													{`(${(editedResource?.access?.users ?? []).length})`}
												</span>
											</TabsTrigger>
											<TabsTrigger value="groups" className="flex-1">
												<span className="font-medium">
													{t("enterprise.admin.client-access-keys.groups")}{" "}
													{`(${(editedResource?.access?.groups ?? []).length})`}
												</span>
											</TabsTrigger>
											<TabsTrigger value="externalUsers" className="flex-1">
												<span className="font-medium">
													{t("enterprise.admin.client-access-keys.externalUsers")}{" "}
													{`(${(editedResource?.access?.externalUsers ?? []).length})`}
												</span>
											</TabsTrigger>
										</TabsList>
										<TabsContent key={"users"} value={"users"}>
											<UsersTable
												repositoryId={editedResource?.id}
												users={editedResource?.access?.users ?? []}
												onChange={(users) => {
													setEditedResource({
														...editedResource,
														access: { ...editedResource?.access, users },
													});
												}}
											/>
										</TabsContent>
										<TabsContent key={"groups"} value={"groups"}>
											<GroupsTable
												groups={editedResource?.access?.groups ?? []}
												onChange={(groups) => {
													setEditedResource({
														...editedResource,
														access: { ...editedResource?.access, groups },
													});
												}}
											/>
										</TabsContent>
										<TabsContent key={"externalUsers"} value={"externalUsers"}>
											<UsersTable
												isExternal
												repositoryId={editedResource?.id}
												users={editedResource?.access?.externalUsers ?? []}
												onChange={(externalUsers) => {
													setEditedResource({
														...editedResource,
														access: { ...editedResource?.access, externalUsers },
													});
												}}
											/>
										</TabsContent>
									</Tabs>
								</div>
							</FormStack>
						</form>
					</Form>
				}
				confirmButton={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button onClick={form.handleSubmit(onSubmit)} disabled={!hasChanges || isSaving}>
								<Icon icon="save" />
								{t("save")}
							</Button>
						)}
					</>
				}
				cancelButton={<Button variant="outline">{t("cancel")}</Button>}
			/>

			<ConfirmationDialog
				isOpen={showUnsavedDialog}
				onOpenChange={setShowUnsavedDialog}
				onSave={handleSave}
				onClose={resetForm}
			/>
		</div>
	);
}
