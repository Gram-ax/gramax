import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { WorkspaceTemplateUploads } from "@ext/enterprise/components/admin/settings/workspace/components/WorkspaceTemplateUploads";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { useWorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSettings";
import { Page } from "@ext/enterprise/types/Page";
import { useEffect, useMemo } from "react";
import { useTabGuard } from "../../hooks/useTabGuard";
import { SettingsPageLayout } from "../../ui-kit/SettingsPageLayout";
import { WorkspaceRepositories } from "./components/repositories/WorkspaceRepositories";
import { WorkspaceSections } from "./components/sections/WorkspaceSections";
import { WorkspaceInfoDefault } from "./components/WorkspaceInfo";
import { WorkspaceStyling } from "./components/WorkspaceStyling";

const useWorkspaceComponentCommon = () => {
	const { settings, ensureLoaded, getTabError, isInitialLoading, isRefreshing } = useSettings();
	const workspaceSettings = settings?.workspace;

	const { localSettings, setLocalSettings, isSaving, handleInputChange, handleSave, saveError } =
		useWorkspaceSettings();

	const isEqual = useCheck(workspaceSettings, localSettings);
	const { hasSectionsOrderChanged, setOriginalSectionsOrder } = useWorkspaceSections(localSettings, setLocalSettings);

	useEffect(() => {
		if (workspaceSettings) {
			setOriginalSectionsOrder(Object.keys(workspaceSettings.sections || {}).join(","));
		}
	}, [workspaceSettings, setOriginalSectionsOrder]);

	const isWorkspaceInitialLoading = isInitialLoading("workspace");

	useTabGuard({
		page: Page.WORKSPACE,
		hasChanges: () => {
			if (isWorkspaceInitialLoading || !workspaceSettings) {
				return false;
			}
			return !isEqual || hasSectionsOrderChanged();
		},
		onSave: handleSave,
		onDiscard: () => {
			if (workspaceSettings) {
				setLocalSettings(workspaceSettings);
				setOriginalSectionsOrder(Object.keys(workspaceSettings.sections || {}).join(","));
			}
		},
	});

	const isSaveDisabled =
		!localSettings.name || !localSettings.git.source.url || (isEqual && !hasSectionsOrderChanged());

	return {
		ensureLoaded,
		isSaving,
		isWorkspaceInitialLoading,
		isWorkspaceRefreshing: isRefreshing("workspace"),
		localSettings,
		saveError,
		setLocalSettings,
		settings,
		tabError: getTabError("workspace"),
		handleInputChange,
		handleSave,
		isSaveDisabled,
	};
};

const WorkspaceComponent = () => {
	const {
		ensureLoaded,
		handleInputChange,
		handleSave,
		isSaving,
		isWorkspaceInitialLoading,
		isWorkspaceRefreshing,
		localSettings,
		saveError,
		setLocalSettings,
		settings,
		tabError,
		isSaveDisabled,
	} = useWorkspaceComponentCommon();

	const selectResources = useMemo(
		() => settings?.resources?.map((resource) => resource.id) ?? [],
		[settings?.resources],
	);

	const sectionResources = useMemo(
		() =>
			selectResources
				?.map((resource) => resource.split("/").pop() || "")
				.filter((id, index, self) => self.indexOf(id) === index) ?? [],
		[selectResources],
	);

	return (
		<SettingsPageLayout
			contentClassName="space-y-8"
			isInitialLoading={isWorkspaceInitialLoading}
			isRefreshing={isWorkspaceRefreshing}
			isSaveDisabled={isSaveDisabled}
			isSaving={isSaving}
			onRetry={() => ensureLoaded("workspace", true)}
			onSave={handleSave}
			page={Page.WORKSPACE}
			saveError={saveError}
			tabError={tabError}
		>
			<WorkspaceInfoDefault localSettings={localSettings} onInputChange={handleInputChange} />
			<WorkspaceRepositories
				localSettings={localSettings}
				selectResources={selectResources ?? []}
				setLocalSettings={setLocalSettings}
			/>
			<WorkspaceSections
				localSettings={localSettings}
				sectionResources={sectionResources ?? []}
				setLocalSettings={setLocalSettings}
			/>
			<WorkspaceStyling localSettings={localSettings} setLocalSettings={setLocalSettings} />
			<WorkspaceTemplateUploads localSettings={localSettings} setLocalSettings={setLocalSettings} />
		</SettingsPageLayout>
	);
};

export default WorkspaceComponent;
