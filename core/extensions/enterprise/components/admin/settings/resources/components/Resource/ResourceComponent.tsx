import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import GroupsTable from "@ext/enterprise/components/admin/settings/resources/components/GroupsTable/GroupsTable";
import UsersTable from "@ext/enterprise/components/admin/settings/resources/components/UsersTable/UsersTable";
import t from "@ext/localization/locale/translate";
import { zodResolver } from "@hookform/resolvers/zod";
import { AsyncSearchSelect, type LoadOptionsParams, type LoadOptionsResult } from "@ui-kit/AsyncSearchSelect";
import { IconButton } from "@ui-kit/Button";
import { Counter } from "@ui-kit/Counter";
import { Form, FormField, FormStack } from "@ui-kit/Form";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FloatingAlert } from "../../../../ui-kit/FloatingAlert";
import type { ResourcesSettings } from "../../types/ResourcesComponent";

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
			<FloatingAlert message={saveError} show={Boolean(saveError)} />
			<Form {...form} asChild>
				<form className="contents" onSubmit={(e) => e.preventDefault()}>
					<FormStack>
						<FloatingAlert message={saveError} show={Boolean(saveError)} />
						{isAddingMode && (
							<div className="flex items-center gap-2 relative z-50 w-full">
								<div className="flex-1 mt-1">
									<FormField
										control={({ field }) => (
											<AsyncSearchSelect
												emptyText={t("enterprise.admin.resources.repository-not-found")}
												loadOptions={loadRepoOptions}
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
												placeholder={t(
													"enterprise.admin.resources.select-repository-placeholder",
												)}
												searchPlaceholder={t(
													"enterprise.admin.resources.search-repository-placeholder",
												)}
												value={field.value || undefined}
											/>
										)}
										description={t("enterprise.admin.resources.select-repository-description")}
										layout="vertical"
										name="repository"
										title={t("enterprise.admin.resources.repository")}
									/>
								</div>
							</div>
						)}

						<div className={!resourceSettings?.id ? "opacity-50 pointer-events-none" : ""}>
							<div className="flex items-center gap-2">
								<div className="flex-1">
									<FormField
										control={({ field }) => (
											<div className="flex items-center gap-2">
												<AsyncSearchSelect
													emptyText={t("enterprise.admin.resources.main-branch-not-found")}
													key={resourceSettings?.mainBranch}
													loadOptions={loadBranchOptions}
													onChange={(option: SearchSelectOption | null) => {
														field.onChange(option);
														if (!resourceSettings) return;
														onChange({
															...resourceSettings,
															mainBranch: String(option?.value || ""),
														});
													}}
													placeholder={t(
														"enterprise.admin.resources.select-main-branch-placeholder",
													)}
													searchPlaceholder={t(
														"enterprise.admin.resources.search-main-branch-placeholder",
													)}
													value={field.value || undefined}
												/>
												<IconButton
													disabled={!resourceSettings?.mainBranch}
													icon="x"
													onClick={() => {
														if (!resourceSettings) return;
														onChange({
															...resourceSettings,
															mainBranch: "",
														});
														form.setValue("mainBranch", undefined);
													}}
													variant="ghost"
												/>
											</div>
										)}
										description={t("enterprise.admin.resources.main-branch-description")}
										layout="vertical"
										name="mainBranch"
										title={t("enterprise.admin.resources.main-branch")}
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
									<TabsTrigger className="flex-1" value="users">
										<span className="font-medium">
											{t("enterprise.admin.users.users")}{" "}
											<Counter variant="text">{`${(resourceSettings?.access?.users ?? []).length}`}</Counter>
										</span>
									</TabsTrigger>
									<TabsTrigger className="flex-1" value="groups">
										<span className="font-medium">
											{t("enterprise.admin.client-access-keys.groups")}{" "}
											<Counter variant="text">{`${(resourceSettings?.access?.groups ?? []).length}`}</Counter>
										</span>
									</TabsTrigger>
									<TabsTrigger className="flex-1" value="externalUsers">
										<span className="font-medium">
											{t("enterprise.admin.client-access-keys.externalUsers")}{" "}
											<Counter variant="text">{`${(resourceSettings?.access?.externalUsers ?? []).length}`}</Counter>
										</span>
									</TabsTrigger>
								</TabsList>
								<TabsContent key={"users"} value={"users"}>
									<UsersTable
										onChange={(users) => {
											onChange({
												...resourceSettings,
												access: { ...resourceSettings?.access, users },
											});
										}}
										repositoryId={resourceSettings?.id}
										users={resourceSettings?.access?.users ?? []}
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
										onChange={(externalUsers) => {
											onChange({
												...resourceSettings,
												access: { ...resourceSettings?.access, externalUsers },
											});
										}}
										repositoryId={resourceSettings?.id}
										users={resourceSettings?.access?.externalUsers ?? []}
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
