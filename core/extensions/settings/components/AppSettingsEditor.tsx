import { getExecutingEnvironment } from "@app/resolveModule/env";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { refreshPage } from "@core-ui/utils/initGlobalFuncs";
// biome-ignore lint/style/noRestrictedImports: existing styled SidebarProvider wrapper
import styled from "@emotion/styled";
import CatalogPropsEditorBody from "@ext/catalog/actions/propsEditor/components/CatalogPropsEditorBody";
import {
	type SettingsTab as CatalogSettingsTab,
	SettingsTabs as CatalogSettingsTabs,
	GitSettingsTabs,
} from "@ext/catalog/actions/propsEditor/components/Sections";
import type { CatalogSettingsModalProps } from "@ext/catalog/actions/propsEditor/logic/createFormSchema";
import { ConfirmationDialog } from "@ext/enterprise/components/admin/ui-kit/ConfirmationDialog";
import ModalErrorHandler from "@ext/errorHandlers/client/components/ModalErrorHandler";
import t from "@ext/localization/locale/translate";
import { applyLoggingPatch } from "@ext/loggers/opentelemetry/logLevel";
import {
	AppSettingsSidebarTabsRenderer,
	type SidebarItem,
} from "@ext/settings/components/AppSettingsSidebarTabsRenderer";
import { AppSettings } from "@ext/settings/levels/app-settings";
import { cachedSettingsStore } from "@ext/settings/logic/cachedSettingsStore";
import { extractDefaults, getByPath } from "@ext/settings/logic/schemaUtils";
import { Level } from "@ext/settings/logic/settings";
import {
	currentFeatureTarget,
	type DefinedFeatures,
	FeatureTarget,
	feature as isFeatureEnabled,
} from "@ext/toggleFeatures/features";
import EditWorkspaceFormBody, {
	WORKSPACE_TABS,
	type WorkspaceTab,
} from "@ext/workspace/components/EditWorkspaceFormBody";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogContent } from "@ui-kit/Dialog";
import { ErrorState } from "@ui-kit/ErrorState";
import { Form, FormFooter, FormHeader } from "@ui-kit/Form";
import type { IconCode } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { Sidebar, SidebarContent, SidebarGroupContent, SidebarGroupLabel, SidebarProvider } from "@ui-kit/Sidebar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useStore } from "zustand";
import {
	type AppSettingsFormData,
	type AppSettingsTab,
	createAppSettingsFormSchema,
	diffPatch,
} from "../logic/formSchema";
import { useResetSettings, useUpdateSettings } from "../logic/hooks";
import { ResetSettingsFormProvider } from "./ResetSettingsFormContext";
import { SettingsDirtyProvider } from "./SettingsDirtyContext";
import { ContentCompareSection } from "./sections/ContentCompareSection";
import DiagnosticsSection from "./sections/DiagnosticsSection";
import ExperimentalSection from "./sections/ExperimentalSection";
import GeneralSection from "./sections/GeneralSection";
import ServicesSection from "./sections/ServicesSection";
import UpdatesSection from "./sections/UpdatesSection";
import { isResettable } from "./settingResetVisible";

const SidebarContainer = styled(SidebarProvider)`
	--sidebar-width: 14rem !important;
	height: 100%;
	min-height: unset;
	max-height: 100%;
	overflow: hidden;

	ul {
		list-style: none !important;
	}

	li {
		line-height: unset;
		margin-bottom: unset;
	}
`;

type AppTabLabel =
	| "general"
	| "services"
	| "diagnostics"
	| "experimental-features"
	| "updates"
	| "editor"
	| "content-compare";

type AppTab = SidebarItem & {
	label: AppTabLabel;
	platforms?: FeatureTarget;
	features?: DefinedFeatures[];
};

const APP_TABS: AppTab[] = [
	{ type: "button", key: "general", icon: "settings", label: "general" },
	{ type: "button", key: "services", icon: "server", label: "services" },
	{
		type: "button",
		key: "updates",
		icon: "refresh-ccw",
		label: "updates",
		platforms: FeatureTarget.desktop,
	},
	{
		type: "button",
		key: "diagnostics",
		icon: "activity",
		label: "diagnostics",
	},
	{
		type: "button",
		key: "experimental-features",
		icon: "code",
		label: "experimental-features",
	},
	{ type: "title", key: "editor", label: "editor", features: ["new-diffs"] },
	{
		type: "button",
		key: "contentCompare",
		icon: "diff",
		label: "content-compare",
		features: ["new-diffs"],
	},
];

// Log capture/export runs only in the browser and desktop apps — SSR/static builds have no diagnostics UI.
const isDiagnosticsAvailable = () => {
	const environment = getExecutingEnvironment();
	return environment === "web" || environment === "tauri";
};

// First leaf validation error as `path: message`, walking RHF's nested errors.
const firstErrorPath = (errors: Record<string, unknown>, prefix = ""): string | null => {
	for (const [key, val] of Object.entries(errors ?? {})) {
		if (!val || key === "ref") continue;
		const path = prefix ? `${prefix}.${key}` : key;
		const message = (val as { message?: unknown }).message;
		if (typeof message === "string") return `${path}: ${message}`;
		if (typeof val === "object") {
			const nested = firstErrorPath(val as Record<string, unknown>, path);
			if (nested) return nested;
		}
	}
	return null;
};

const parseLevel = (raw: string): Level | undefined => {
	const num = Number(raw);
	if (num === Level.app || num === Level.workspace || num === Level.catalog) return num;
	return undefined;
};

export interface AppSettingsEditorProps {
	defaultLevel?: Level;
	onClose?: () => void;
	/** Forwarded to the catalog body — callers like CatalogExistsError react to a successful catalog save. */
	onCatalogSubmit?: CatalogSettingsModalProps["onSubmit"];
	/** Extra DialogContent attributes (e.g. data-upper-error to stack above an error dialog). */
	modalContentProps?: Record<string, unknown>;
}

const schemaDefaults = extractDefaults(AppSettings) as Record<string, unknown>;

const buildDefaults = (values: Record<string, unknown>): AppSettingsFormData => {
	// AI is configured at the workspace level (EditWorkspaceFormBody), so its
	// keys never reach the app-level form.
	const { ai: _ai, ...services } = (values.services ?? {}) as Record<string, unknown>;
	return {
		general: (values.general ?? {}) as AppSettingsFormData["general"],
		services: services as AppSettingsFormData["services"],
		// The schema requires the whole compress-images block; without it zod
		// rejects the form on submit and the settings dialog never closes.
		"compress-images": {
			...(schemaDefaults["compress-images"] as AppSettingsFormData["compress-images"]),
			...((values["compress-images"] ?? {}) as Partial<AppSettingsFormData["compress-images"]>),
		},
		logging: (values.logging ?? schemaDefaults.logging) as AppSettingsFormData["logging"],
		contentCompare: {
			...(schemaDefaults.contentCompare as AppSettingsFormData["contentCompare"]),
			...((values.contentCompare ?? {}) as Partial<AppSettingsFormData["contentCompare"]>),
		},
	};
};

const AppSettingsEditor = ({
	defaultLevel = Level.app,
	onClose,
	onCatalogSubmit,
	modalContentProps,
}: AppSettingsEditorProps) => {
	const [open, setOpen] = useState(true);
	const workspace = WorkspaceService.current();
	const catalogProps = useCatalogPropsStore((state) => state.data);
	const hasCatalog = !!catalogProps;
	const sourceName = useCatalogPropsStore((state) => state.data?.sourceName);
	const hasGitSource = !!sourceName;
	// GES-managed workspaces are configured through the GES admin panel
	// (see SwitchWorkspace), so the local Workspace level is unavailable.
	const isGesWorkspace = !!workspace?.enterprise?.gesUrl;
	const canEditWorkspace = !!workspace && !isGesWorkspace;

	const resolveInitialLevel = (next: Level): Level => {
		if (next === Level.workspace && !canEditWorkspace) return Level.app;
		if (next === Level.catalog && !hasCatalog) return Level.app;
		return next;
	};

	const [level, setLevel] = useState<Level>(() => resolveInitialLevel(defaultLevel));
	const [appActiveTab, setAppActiveTab] = useState<AppSettingsTab>("general");
	const [workspaceActiveTab, setWorkspaceActiveTab] = useState<WorkspaceTab>("general");
	const [catalogActiveTab, setCatalogActiveTab] = useState<CatalogSettingsTab>("general");
	const [isSaving, setIsSaving] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);
	const update = useUpdateSettings("app");
	const reset = useResetSettings("app");
	const pendingResetKeys = useRef(new Set<string>());

	useEffect(() => {
		if (!hasGitSource && catalogActiveTab in GitSettingsTabs) setCatalogActiveTab("general");
	}, [hasGitSource, catalogActiveTab]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: needed
	const onLevelChange = useCallback(
		(raw: string) => {
			const parsed = parseLevel(raw);
			if (parsed === undefined) return;
			setLevel(resolveInitialLevel(parsed));
		},
		[workspace, hasCatalog],
	);

	const schema = useMemo(() => createAppSettingsFormSchema(), []);

	// Subscribe to cached settings so the form picks up post-mount hydration.
	const values = useStore(cachedSettingsStore, (s) => s.appValues);
	const defaultValues = useMemo(() => buildDefaults(values as Record<string, unknown>), [values]);

	const form = useForm<AppSettingsFormData>({
		resolver: zodResolver(schema),
		defaultValues,
		mode: "onChange",
	});

	// Re-seed the form when settings hydrate after first paint, but never
	// clobber pending edits.
	useEffect(() => {
		if (!form.formState.isDirty) form.reset(defaultValues);
	}, [defaultValues, form]);

	useEffect(() => {
		if (!open) onClose?.();
	}, [open, onClose]);

	const getResetKeysForData = useCallback((data: Record<string, unknown>) => {
		return [...pendingResetKeys.current].filter((key) => {
			const value = getByPath(data, key);
			const defaultValue = getByPath(schemaDefaults, key);
			return !isResettable(value, defaultValue);
		});
	}, []);

	const persistFormData = useCallback(
		async (data: AppSettingsFormData) => {
			const patch = diffPatch(
				data as Record<string, unknown>,
				form.formState.defaultValues as Record<string, unknown>,
			);
			const resetKeys = getResetKeysForData(data as Record<string, unknown>);
			for (const key of resetKeys) delete patch[key];

			if (Object.keys(patch).length > 0) await update(patch);
			if (resetKeys.length > 0) await reset(resetKeys);
			pendingResetKeys.current.clear();
			form.reset(data);

			// Logging settings persist only here (on save), so their runtime side effects
			// (OTel SDK on/off, level push to Rust) fire now — reset keys land on their defaults.
			const runtimePatch = { ...patch };
			for (const key of resetKeys) runtimePatch[key] = getByPath(schemaDefaults, key);
			await applyLoggingPatch(runtimePatch);
		},
		[form, getResetKeysForData, reset, update],
	);

	const onSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			void form.handleSubmit(
				async (data) => {
					setSubmitError(null);
					setIsSaving(true);
					try {
						await persistFormData(data);
						refreshPage();
						setOpen(false);
					} finally {
						setIsSaving(false);
					}
				},
				(errors) => setSubmitError(firstErrorPath(errors) ?? t("error")),
			)(e);
		},
		[form, persistFormData],
	);

	// Workspace/catalog level bodies own their own form; they report dirtiness
	// and register their own submit so the guard covers them too, not just the
	// app-level form.
	const [childDirty, setChildDirty] = useState(false);
	const childSave = useRef<(() => Promise<void>) | null>(null);
	const isDirty = form.formState.isDirty || childDirty;

	const dirtyContextValue = useMemo(
		() => ({
			reportDirty: setChildDirty,
			registerSave: (save: (() => Promise<void>) | null) => {
				childSave.current = save;
			},
		}),
		[],
	);

	const persistWithoutClose = useCallback(async () => {
		const data = form.getValues();
		await persistFormData(data);
	}, [form, persistFormData]);

	// "Save and close" in the guard: save whichever level is actually dirty —
	// the app form and/or the active child body's form.
	const saveActiveLevel = useCallback(async () => {
		if (form.formState.isDirty) await persistWithoutClose();
		if (childDirty) await childSave.current?.();
	}, [form, persistWithoutClose, childDirty]);

	const resetFormContextValue = useMemo(
		() => ({
			markReset: (key: string) => {
				pendingResetKeys.current.add(key);
			},
		}),
		[],
	);

	// biome-ignore lint/correctness/noUnusedVariables: consumer is the level-switching Select, currently commented out below
	const guardedLevelChange = useCallback(
		(raw: string) => {
			if (isDirty) {
				setPendingAction(() => () => onLevelChange(raw));
				return;
			}
			onLevelChange(raw);
		},
		[isDirty, onLevelChange],
	);

	const onDialogOpenChange = useCallback(
		(next: boolean) => {
			if (!next && isDirty) {
				setPendingAction(() => () => setOpen(false));
				return;
			}
			setOpen(next);
		},
		[isDirty],
	);

	const onCloseHandler = useCallback(() => setOpen(false), []);

	// Each level is its own settings window, so the header names the thing being
	// configured instead of the generic app-settings title.
	const header = useMemo(() => {
		if (level === Level.workspace)
			return { title: t("workspace.edit"), description: t("workspace.configure-your-workspace") };
		if (level === Level.catalog)
			return {
				title: t("forms.catalog-edit-props.name"),
				description: t("forms.catalog-edit-props.description"),
			};
		return { title: t("app-settings.title"), description: t("app-settings.description") };
	}, [level]);

	const renderSection = () => {
		switch (appActiveTab) {
			case "general":
				return <GeneralSection form={form} />;
			case "services":
				return <ServicesSection showReset />;
			case "updates":
				return <UpdatesSection onClose={onCloseHandler} />;
			case "diagnostics":
				return <DiagnosticsSection />;
			case "experimental-features":
				return <ExperimentalSection />;
			case "contentCompare":
				return <ContentCompareSection form={form} />;
		}
	};

	const visibleAppTabs = useMemo(
		() =>
			APP_TABS.filter(
				(tab) =>
					(tab.platforms === undefined || (tab.platforms & currentFeatureTarget()) !== 0) &&
					(tab.features === undefined || tab.features.every(isFeatureEnabled)),
			).filter((tab) => tab.key !== "diagnostics" || isDiagnosticsAvailable()),
		[],
	);

	useEffect(() => {
		if (!visibleAppTabs.some((t) => t.key === appActiveTab)) setAppActiveTab("general");
	}, [appActiveTab, visibleAppTabs]);

	const appTabItems = useMemo<SidebarItem[]>(
		() =>
			visibleAppTabs.map(({ platforms: _platforms, features: _features, ...tab }) => ({
				...tab,
				label: t(`app-settings.tabs.${tab.label}` as const),
			})),
		[visibleAppTabs],
	);

	const workspaceTabItems = useMemo<SidebarItem[]>(
		() =>
			(
				Object.entries(WORKSPACE_TABS) as [WorkspaceTab, (typeof WORKSPACE_TABS)[keyof typeof WORKSPACE_TABS]][]
			).map(([_, tab]) => ({
				type: tab.type,
				key: tab.key,
				icon: tab.icon,
				label: t(tab.label as Parameters<typeof t>[0]),
			})),
		[],
	);

	const catalogTabItems = useMemo<SidebarItem[]>(
		() =>
			Object.entries(CatalogSettingsTabs).map(([key, tab]) => ({
				type: tab.type,
				key: tab.key,
				icon: tab.icon as IconCode,
				label: t(`forms.catalog-edit-props.tabs.${key as CatalogSettingsTab}`),
			})),
		[],
	);

	const gitTabItems = useMemo<SidebarItem[]>(
		() =>
			Object.entries(GitSettingsTabs).map(([key, tab]) => ({
				type: tab.type,
				key: tab.key,
				icon: tab.icon as IconCode,
				label: t(`forms.catalog-edit-props.tabs.${key as CatalogSettingsTab}`),
			})),
		[],
	);

	const renderTabs = () => {
		if (level === Level.app)
			return (
				<AppSettingsSidebarTabsRenderer
					active={appActiveTab}
					items={appTabItems}
					onChange={(k) => setAppActiveTab(k as AppSettingsTab)}
				/>
			);
		if (level === Level.workspace)
			return (
				<AppSettingsSidebarTabsRenderer
					active={workspaceActiveTab}
					items={workspaceTabItems}
					onChange={(k) => setWorkspaceActiveTab(k as WorkspaceTab)}
				/>
			);
		if (level === Level.catalog)
			return (
				<>
					<AppSettingsSidebarTabsRenderer
						active={catalogActiveTab}
						items={catalogTabItems}
						onChange={(k) => setCatalogActiveTab(k as CatalogSettingsTab)}
					/>
					{hasGitSource && (
						<>
							<SidebarGroupLabel>{t("forms.catalog-edit-props.sidebar.git")}</SidebarGroupLabel>
							<AppSettingsSidebarTabsRenderer
								active={catalogActiveTab}
								items={gitTabItems}
								onChange={(k) => setCatalogActiveTab(k as CatalogSettingsTab)}
							/>
						</>
					)}
				</>
			);
		return null;
	};

	const renderMain = () => {
		if (level === Level.app) {
			return (
				<FormProvider {...form}>
					<ResetSettingsFormProvider value={resetFormContextValue}>
						<Form asChild {...form}>
							<form className="flex flex-col h-full min-h-0" onSubmit={onSubmit}>
								<div className="flex-1 min-h-0 overflow-hidden">
									{renderSection()}
									{submitError && <ErrorState className="text-sm shrink-0">{submitError}</ErrorState>}
								</div>
								<FormFooter
									className="flex-shrink-0"
									primaryButton={
										<Button disabled={isSaving} type="submit" variant="primary">
											{isSaving && <Loader size="sm" />}
											{t("save")}
										</Button>
									}
								/>
							</form>
						</Form>
					</ResetSettingsFormProvider>
				</FormProvider>
			);
		}
		if (level === Level.workspace && workspace) {
			return (
				<EditWorkspaceFormBody activeTab={workspaceActiveTab} onClose={onCloseHandler} workspace={workspace} />
			);
		}
		if (level === Level.catalog) {
			return (
				<CatalogPropsEditorBody
					activeTab={catalogActiveTab}
					onClose={onCloseHandler}
					onSubmit={onCatalogSubmit}
				/>
			);
		}
		return null;
	};

	return (
		<Dialog onOpenChange={onDialogOpenChange} open={open}>
			<DialogContent
				data-modal-root
				{...modalContentProps}
				className="overflow-hidden p-0"
				size="M"
				style={{
					height: "calc(100vh - 2rem)",
					maxHeight: "min(800px, calc(100vh - 44px))",
				}}
			>
				<ModalErrorHandler onClose={onCloseHandler} onError={() => {}}>
					<FormHeader description={header.description} icon="settings" title={header.title} />
					<SidebarContainer>
						<Sidebar collapsible="none">
							<SidebarContent>
								<SidebarGroupContent>
									<SidebarGroupContent className="px-2 py-2">{renderTabs()}</SidebarGroupContent>
								</SidebarGroupContent>
							</SidebarContent>
						</Sidebar>
						<main className="flex flex-1 flex-col overflow-hidden min-h-0">
							<SettingsDirtyProvider value={dirtyContextValue}>{renderMain()}</SettingsDirtyProvider>
						</main>
					</SidebarContainer>
				</ModalErrorHandler>
			</DialogContent>
			<ConfirmationDialog
				isOpen={pendingAction !== null}
				onClose={() => {
					form.reset(form.formState.defaultValues);
					pendingResetKeys.current.clear();
					pendingAction?.();
					setPendingAction(null);
				}}
				onOpenChange={(next) => {
					if (!next) setPendingAction(null);
				}}
				onSave={saveActiveLevel}
			/>
		</Dialog>
	);
};

export default AppSettingsEditor;
