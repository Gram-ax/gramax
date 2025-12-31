import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import GroupsTable from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/GroupsTable";
import UsersTable from "@ext/enterprise/components/admin/settings/resources/components/UsersTable/UsersTable";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncSearchSelect, LoadOptionsParams, LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import { IconButton } from "@ui-kit/Button";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingAlert } from "../../../../ui-kit/FloatingAlert";
import { ResourcesSettings } from "../../types/ResourcesComponent";

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

interface ResourceComponentProps {
	isAddingMode?: boolean;
	resourceSettings?: ResourcesSettings;
	resourcesSettings?: ResourcesSettings[];
	onChange: (resource: ResourcesSettings) => void;
}

export default function ResourceComponent({
	isAddingMode,
	resourceSettings,
	resourcesSettings,
	onChange,
}: ResourceComponentProps) {
	const { global, searchBranches } = useSettings();
	const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const allGitResources = global?.allGitResources ?? [];
	const formSchema = createFormSchema();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
	});

	const isRepositoryLocked = useMemo(() => {
		return !isAddingMode && resourceSettings;
	}, [isAddingMode, resourceSettings]);

	const loadRepoOptions = useCallback(
		// eslint-disable-next-line @typescript-eslint/require-await
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			const selected = new Set(resourcesSettings.map((r) => r.id));
			const q = searchQuery.toLowerCase();

			const filteredOptions = allGitResources.filter(
				(resource) => !selected.has(resource) && resource.toLowerCase().includes(q),
			);

			return { options: filteredOptions.map((resource) => ({ value: resource, label: resource })) };
		},
		[resourcesSettings, allGitResources],
	);

	const loadBranchOptions = useCallback(
		async ({ searchQuery }: LoadOptionsParams): Promise<LoadOptionsResult<SearchSelectOption>> => {
			if (!resourceSettings) return { options: [] };
			try {
				const branches = await searchBranches(resourceSettings?.id ?? "");
				const filteredOptions = branches
					.filter((branch) => branch.toLowerCase().includes(searchQuery.toLowerCase()))
					.map((branch) => ({
						value: branch,
						label: branch,
					}));

				return { options: filteredOptions };
			} catch (error) {
				console.error("Error loading branches:", error);
				return { options: [] };
			}
		},
		[resourceSettings?.id, searchBranches],
	);

	useEffect(() => {
		if (!saveError) return;
		const t = setTimeout(() => setSaveError(null), 4000);
		return () => clearTimeout(t);
	}, [saveError]);

	useEffect(() => {
		const value = resourceSettings?.mainBranch
			? { value: resourceSettings.mainBranch, label: resourceSettings.mainBranch }
			: undefined;
		form.setValue("mainBranch", value);
	}, [resourceSettings?.mainBranch]);

	useEffect(() => {
		if (showUnsavedDialog) setShowUnsavedDialog(showUnsavedDialog);
	}, [showUnsavedDialog]);

	return (
		<>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />
			<Form {...form} asChild>
				<form className="contents" onSubmit={(e) => e.preventDefault()}>
					<FormStack>
						<FloatingAlert show={Boolean(saveError)} message={saveError} />
						{isAddingMode && (
							<div className="flex items-center gap-2 relative z-50 w-full">
								<div className="flex-1 mt-1">
									<FormField
										name="repository"
										title={t("enterprise.admin.resources.repository")}
										layout="vertical"
										description={t("enterprise.admin.resources.select-repository-description")}
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
																onChange({
																	id: String(option?.value || ""),
																	mainBranch: "",
																	access: {
																		users: [],
																		groups: [],
																		externalUsers: [],
																	},
																});
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

						<div className={!resourceSettings?.id ? "opacity-50 pointer-events-none" : ""}>
							<div className="flex items-center gap-2">
								<div className="flex-1">
									<FormField
										name="mainBranch"
										title={t("enterprise.admin.resources.main-branch")}
										layout="vertical"
										description={t("enterprise.admin.resources.main-branch-description")}
										control={({ field }) => (
											<div className="flex items-center gap-2">
												<AsyncSearchSelect
													key={resourceSettings?.mainBranch}
													loadOptions={loadBranchOptions}
													value={field.value || undefined}
													placeholder={t(
														"enterprise.admin.resources.select-main-branch-placeholder",
													)}
													onChange={(option: SearchSelectOption | null) => {
														field.onChange(option);
														if (!resourceSettings) return;
														onChange({
															...resourceSettings,
															mainBranch: String(option?.value || ""),
														});
													}}
													searchPlaceholder={t(
														"enterprise.admin.resources.search-main-branch-placeholder",
													)}
													emptyText={t("enterprise.admin.resources.main-branch-not-found")}
												/>
												<IconButton
													icon="x"
													variant="ghost"
													disabled={!resourceSettings?.mainBranch}
													onClick={() => {
														if (!resourceSettings) return;
														onChange({
															...resourceSettings,
															mainBranch: "",
														});
														form.setValue("mainBranch", undefined);
													}}
												/>
											</div>
										)}
									/>
								</div>
							</div>
						</div>
						<div className={!resourceSettings?.id ? "opacity-50 pointer-events-none mt-2" : "mt-2"}>
							<label className="text-primary-fg flex h-4 min-w-0 items-center gap-x-0.5 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
								<span>{t("enterprise.admin.resources.access")}</span>
							</label>
							<Tabs defaultValue="users">
								<TabsList className="w-full">
									<TabsTrigger value="users" className="flex-1">
										<span className="font-medium">
											{t("enterprise.admin.users.users")}{" "}
											{`(${(resourceSettings?.access?.users ?? []).length})`}
										</span>
									</TabsTrigger>
									<TabsTrigger value="groups" className="flex-1">
										<span className="font-medium">
											{t("enterprise.admin.client-access-keys.groups")}{" "}
											{`(${(resourceSettings?.access?.groups ?? []).length})`}
										</span>
									</TabsTrigger>
									<TabsTrigger value="externalUsers" className="flex-1">
										<span className="font-medium">
											{t("enterprise.admin.client-access-keys.externalUsers")}{" "}
											{`(${(resourceSettings?.access?.externalUsers ?? []).length})`}
										</span>
									</TabsTrigger>
								</TabsList>
								<TabsContent key={"users"} value={"users"}>
									<UsersTable
										repositoryId={resourceSettings?.id}
										users={resourceSettings?.access?.users ?? []}
										onChange={(users) => {
											onChange({
												...resourceSettings,
												access: { ...resourceSettings?.access, users },
											});
										}}
									/>
								</TabsContent>
								<TabsContent key={"groups"} value={"groups"}>
									<GroupsTable
										groups={resourceSettings?.access?.groups ?? []}
										onChange={(groups) => {
											onChange({
												...resourceSettings,
												access: { ...resourceSettings?.access, groups },
											});
										}}
									/>
								</TabsContent>
								<TabsContent key={"externalUsers"} value={"externalUsers"}>
									<UsersTable
										isExternal
										repositoryId={resourceSettings?.id}
										users={resourceSettings?.access?.externalUsers ?? []}
										onChange={(externalUsers) => {
											onChange({
												...resourceSettings,
												access: { ...resourceSettings?.access, externalUsers },
											});
										}}
									/>
								</TabsContent>
							</Tabs>
						</div>
					</FormStack>
				</form>
			</Form>
		</>
	);
}
