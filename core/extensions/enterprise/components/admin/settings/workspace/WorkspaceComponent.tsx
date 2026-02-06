import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { useWorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSettings";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import t from "@ext/localization/locale/translate";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { useEffect } from "react";
import { useTabGuard } from "../../hooks";
import { FloatingAlert } from "../../ui-kit/FloatingAlert";
import { Spinner } from "../../ui-kit/Spinner";
import { StickyHeader } from "../../ui-kit/StickyHeader";
import { TabErrorBlock } from "../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../ui-kit/TabInitialLoader";
import { RoleId } from "../components/roles/Access";
import { getGroupsWithNames } from "./components/access/components/group/utils/groupUtils";
import { WorkspaceAccess } from "./components/access/WorkspaceAccess";
import { PdfTemplates } from "./components/PdfTemplates";
import { WorkspaceRepositories } from "./components/repositories/WorkspaceRepositories";
import { WorkspaceSections } from "./components/sections/WorkspaceSections";
import { WordTemplates } from "./components/WordTemplates";
import { WorkspaceInfo } from "./components/WorkspaceInfo";
import { WorkspaceStyling } from "./components/WorkspaceStyling";

const ownerRole: RoleId = "workspaceOwner";

const WorkspaceComponent = () => {
	const { settings, ensureWorkspaceLoaded, getTabError, isInitialLoading, isRefreshing } = useSettings();
	const workspaceSettings = settings?.workspace;

	const { localSettings, setLocalSettings, isSaving, isScrolled, handleInputChange, handleSave, saveError } =
		useWorkspaceSettings();

	const isEqual = useCheck(workspaceSettings, localSettings);
	const { hasSectionsOrderChanged, setOriginalSectionsOrder } = useWorkspaceSections(localSettings, setLocalSettings);

	const selectGroups = getGroupsWithNames(settings?.groups);
	const selectResources = settings?.resources?.map((resource) => resource.id) ?? [];

	const sectionResources =
		selectResources
			?.map((resource) => resource.split("/").pop() || "")
			.filter((id, index, self) => self.indexOf(id) === index) ?? [];

	useEffect(() => {
		if (workspaceSettings) {
			setOriginalSectionsOrder(Object.keys(workspaceSettings.sections || {}).join(","));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [workspaceSettings]);

	useTabGuard({
		page: Page.WORKSPACE,
		hasChanges: () => {
			if (isInitialLoading("workspace") || !workspaceSettings) {
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

	const tabError = getTabError("workspace");

	if (isInitialLoading("workspace")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureWorkspaceLoaded(true)} />;
	}

	return (
		<>
			<StickyHeader
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text={`${t("save2")}...`} />
						) : (
							<Button
								disabled={
									!localSettings.name ||
									!localSettings.source.url ||
									(isEqual && !hasSectionsOrderChanged())
								}
								onClick={handleSave}
							>
								<Icon icon="save" />
								{t("save")}
							</Button>
						)}
					</>
				}
				isScrolled={isScrolled}
				title={
					<>
						{getAdminPageTitle(Page.WORKSPACE)} <Spinner show={isRefreshing("workspace")} size="small" />
					</>
				}
			/>
			<FloatingAlert message={saveError} show={Boolean(saveError)} />
			<div className="px-6 space-y-6">
				<WorkspaceInfo localSettings={localSettings} onInputChange={handleInputChange} />

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

				<WordTemplates localSettings={localSettings} setLocalSettings={setLocalSettings} />
				<PdfTemplates localSettings={localSettings} setLocalSettings={setLocalSettings} />
			</div>
		</>
	);
};

export default WorkspaceComponent;
