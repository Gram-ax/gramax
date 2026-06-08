import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { WorkspaceTemplateUploads } from "@ext/enterprise/components/admin/settings/workspace/components/WorkspaceTemplateUploads";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { useWorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSettings";
import { Page } from "@ext/enterprise/types/Page";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { useEffect, useMemo } from "react";
import { useTabGuard } from "../../hooks";
import { FloatingAlert } from "../../ui-kit/FloatingAlert";
import { Spinner } from "../../ui-kit/Spinner";
import { StickyHeader } from "../../ui-kit/StickyHeader";
import { TabErrorBlock } from "../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../ui-kit/TabInitialLoader";
import type { RoleId } from "../components/roles/Access";
import { getGroupsWithNames } from "./components/access/components/group/utils/groupUtils";
import { WorkspaceAccess } from "./components/access/WorkspaceAccess";
import { WorkspaceRepositories } from "./components/repositories/WorkspaceRepositories";
import { WorkspaceSections } from "./components/sections/WorkspaceSections";
import { WorkspaceInfoDefault } from "./components/WorkspaceInfo";
import { WorkspaceStyling } from "./components/WorkspaceStyling";

const ownerRole: RoleId = "workspaceOwner";

const useWorkspaceComponentCommon = () => {
	const { settings, ensureWorkspaceLoaded, getTabError, isInitialLoading, isRefreshing } = useSettings();
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
		ensureWorkspaceLoaded,
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

interface WorkspaceLayoutProps {
	children: React.ReactNode;
	handleSave: () => void;
	isRefreshingWorkspace: boolean;
	isSaveDisabled: boolean;
	isSaving: boolean;
	saveError: string | null;
}

const WorkspaceLayout = ({
	children,
	handleSave,
	isRefreshingWorkspace,
	isSaveDisabled,
	isSaving,
	saveError,
}: WorkspaceLayoutProps) => {
	return (
		<>
			<StickyHeader
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button disabled={isSaveDisabled} onClick={handleSave}>
								{t("save")}
							</Button>
						)}
					</>
				}
				title={
					<>
						{getAdminPageTitle(Page.WORKSPACE)} <Spinner show={isRefreshingWorkspace} size="small" />
					</>
				}
			/>
			<FloatingAlert message={saveError} show={Boolean(saveError)} />
			<div className="space-y-6">{children}</div>
		</>
	);
};

const WorkspaceComponent = () => {
	const {
		ensureWorkspaceLoaded,
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

	const selectGroups = useMemo(() => getGroupsWithNames(settings?.groups), [settings?.groups]);

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

	if (isWorkspaceInitialLoading) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureWorkspaceLoaded(true)} />;
	}

	return (
		<WorkspaceLayout
			handleSave={handleSave}
			isRefreshingWorkspace={isWorkspaceRefreshing}
			isSaveDisabled={isSaveDisabled}
			isSaving={isSaving}
			saveError={saveError}
		>
			<WorkspaceInfoDefault localSettings={localSettings} onInputChange={handleInputChange} />
			<WorkspaceAccess
				groups={selectGroups}
				localSettings={localSettings}
				ownerRole={ownerRole}
				setLocalSettings={setLocalSettings}
			/>
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
		</WorkspaceLayout>
	);
};

export default WorkspaceComponent;
