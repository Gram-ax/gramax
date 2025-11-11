import useCheck from "@core-ui/hooks/useCheck";
import { useSettings } from "@ext/enterprise/components/admin/contexts/SettingsContext";
import { useWorkspaceSections } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSections";
import { useWorkspaceSettings } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceSettings";
import { useWorkspaceTemplates } from "@ext/enterprise/components/admin/settings/workspace/hooks/useWorkspaceTemplates";
import { Page } from "@ext/enterprise/types/EnterpriseAdmin";
import { getAdminPageTitle } from "@ext/enterprise/utils/getAdminPageTitle";
import { Button, LoadingButtonTemplate } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { useEffect } from "react";
import { ConfirmationDialog } from "../../ui-kit/ConfirmationDialog";
import { FloatingAlert } from "../../ui-kit/FloatingAlert";
import { Spinner } from "../../ui-kit/Spinner";
import { StickyHeader } from "../../ui-kit/StickyHeader";
import { TabErrorBlock } from "../../ui-kit/TabErrorBlock";
import { TabInitialLoader } from "../../ui-kit/TabInitialLoader";
import { RoleId } from "../components/roles/Access";
import { WorkspaceAccess } from "./components/access/WorkspaceAccess";
import { WorkspaceRepositories } from "./components/repositories/WorkspaceRepositories";
import { WorkspaceSections } from "./components/sections/WorkspaceSections";
import { WorkspaceInfo } from "./components/WorkspaceInfo";
import { WorkspaceStyling } from "./components/WorkspaceStyling";
import { WorkspaceTemplates } from "./components/WorkspaceTemplates";
import { AuthMethod, AuthOption } from "./types/WorkspaceComponent";

const ownerRole: RoleId = "workspaceOwner";

const authOptions: AuthOption[] = [
	{ label: "Только Single Sign-On (SSO)", value: [AuthMethod.SSO] },
	{ label: "SSO и Почта (Внешние читатели)", value: [AuthMethod.SSO, AuthMethod.GUEST_MAIL] },
];

const WorkspaceComponent = () => {
	const { settings, ensureWorkspaceLoaded, getTabError, isInitialLoading, isRefreshing } = useSettings();
	const workspaceSettings = settings?.workspace;

	const { localSettings, setLocalSettings, isSaving, isScrolled, handleInputChange, handleSave, saveError } =
		useWorkspaceSettings();

	const isEqual = useCheck(workspaceSettings, localSettings);
	const { hasSectionsOrderChanged, setOriginalSectionsOrder } = useWorkspaceSections(localSettings, setLocalSettings);

	const {
		duplicateDialogOpen,
		setDuplicateDialogOpen,
		pendingDuplicate,
		setPendingDuplicate,
		handleReplaceTemplate,
	} = useWorkspaceTemplates(localSettings, setLocalSettings);

	const selectGroups = [...Object.keys(settings?.groups ?? {})];
	const selectResources = settings?.resources?.map((resource) => resource.id) ?? [];

	const sectionResources =
		selectResources
			?.map((resource) => resource.split("/").pop() || "")
			.filter((id, index, self) => self.indexOf(id) === index) ?? [];

	const handleAuthMethodChange = (selectedLabel: string) => {
		const selectedOption = authOptions.find((opt) => opt.label === selectedLabel);
		if (selectedOption) {
			setLocalSettings((prev) => ({
				...prev,
				authMethods: selectedOption.value,
			}));
		}
	};

	useEffect(() => {
		if (workspaceSettings) {
			setOriginalSectionsOrder(Object.keys(workspaceSettings.sections || {}).join(","));
		}
	}, [workspaceSettings, setOriginalSectionsOrder]);

	const tabError = getTabError("workspace");

	if (isInitialLoading("workspace")) {
		return <TabInitialLoader />;
	}

	if (tabError) {
		return <TabErrorBlock message={tabError.message} onRetry={() => ensureWorkspaceLoaded(true)} />;
	}

	return (
		<div>
			<StickyHeader
				title={
					<>
						{getAdminPageTitle(Page.WORKSPACE)} <Spinner size="small" show={isRefreshing("workspace")} />
					</>
				}
				isScrolled={isScrolled}
				actions={
					<>
						{isSaving ? (
							<LoadingButtonTemplate text="Сохраняем..." />
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
								Сохранить
							</Button>
						)}
					</>
				}
			/>
			<FloatingAlert show={Boolean(saveError)} message={saveError} />
			<div className="space-y-6">
				<WorkspaceInfo
					localSettings={localSettings}
					onInputChange={handleInputChange}
					onAuthMethodChange={handleAuthMethodChange}
				/>

				<WorkspaceAccess
					localSettings={localSettings}
					setLocalSettings={setLocalSettings}
					ownerRole={ownerRole}
					groups={selectGroups}
				/>

				<WorkspaceRepositories
					localSettings={localSettings}
					setLocalSettings={setLocalSettings}
					selectResources={selectResources ?? []}
				/>

				<WorkspaceSections
					localSettings={localSettings}
					setLocalSettings={setLocalSettings}
					sectionResources={sectionResources ?? []}
				/>

				<WorkspaceStyling localSettings={localSettings} setLocalSettings={setLocalSettings} />

				<WorkspaceTemplates localSettings={localSettings} setLocalSettings={setLocalSettings} />
			</div>

			<ConfirmationDialog
				isOpen={duplicateDialogOpen}
				onOpenChange={setDuplicateDialogOpen}
				onSave={handleReplaceTemplate}
				onClose={() => {
					setPendingDuplicate(null);
				}}
				title="Шаблон уже существует"
				description={`Шаблон «${pendingDuplicate?.title ?? ""}» уже существует. Заменить его?`}
				confirmText="Заменить"
				cancelText="Отмена"
				showDiscard={false}
			/>
		</div>
	);
};

export default WorkspaceComponent;
