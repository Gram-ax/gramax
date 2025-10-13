import { Icon } from "@ui-kit/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import {
	useSyncableWorkspaces,
	type UseSyncableWorkspacesReturn,
} from "@core-ui/ContextServices/SyncCount/useSyncableWorkspaces";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useEnterpriseWorkspaceEdit } from "@ext/enterprise/components/useEditEnterpriseWorkspace";
import t, { pluralize } from "@ext/localization/locale/translate";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { MenuItemInteractiveTemplate } from "@ui-kit/MenuItem";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import {
	DropdownIndicator,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { useState } from "react";
import resolveModule from "@app/resolveModule/frontend";

const formatTooltip = (
	workspace: WorkspacePath,
	currentWorkspace: WorkspacePath,
	data: UseSyncableWorkspacesReturn,
) => {
	if (workspace != currentWorkspace && !data.syncableWorkspaces[workspace]) return null;

	const count = data.syncableWorkspaces[workspace];
	const workspaceCount = Object.keys(data.syncableWorkspaces).length;
	const totalCount = Object.values(data.syncableWorkspaces).reduce((acc, count) => acc + count, 0);

	if (currentWorkspace == workspace) {
		if (data.isCurrentWorkspaceSyncable && data.syncableWorkspacesCount === 1) {
			return pluralize(count, {
				one: t("workspace.tooltip.only-current.one"),
				few: t("workspace.tooltip.only-current.few"),
				many: t("workspace.tooltip.only-current.many"),
			});
		}

		if (data.isCurrentWorkspaceSyncable && data.syncableWorkspacesCount > 1) {
			const currentCount = data.syncableWorkspaces[currentWorkspace];

			return pluralize(totalCount, {
				one: t("workspace.tooltip.including-current.one")
					.replace("{{current-count}}", currentCount)
					.replace("{{workspace-count}}", workspaceCount),
				few: t("workspace.tooltip.including-current.few")
					.replace("{{current-count}}", currentCount)
					.replace("{{workspace-count}}", workspaceCount),
				many: t("workspace.tooltip.including-current.many")
					.replace("{{current-count}}", currentCount)
					.replace("{{workspace-count}}", workspaceCount),
			});
		}

		if (!data.isCurrentWorkspaceSyncable && data.syncableWorkspacesCount === 1) {
			return pluralize(totalCount, {
				one: t("workspace.tooltip.only-one-excluding-current.one"),
				few: t("workspace.tooltip.only-one-excluding-current.few"),
				many: t("workspace.tooltip.only-one-excluding-current.many"),
			});
		}

		if (!data.isCurrentWorkspaceSyncable) {
			if (workspaceCount == 0) return null;

			return pluralize(totalCount, {
				one: t("workspace.tooltip.excluding-current.one").replace("{{workspace-count}}", workspaceCount),
				few: t("workspace.tooltip.excluding-current.few").replace("{{workspace-count}}", workspaceCount),
				many: t("workspace.tooltip.excluding-current.many").replace("{{workspace-count}}", workspaceCount),
			});
		}

		return "Invalid count";
	}

	return pluralize(
		count,
		{
			one: t("workspace.tooltip.has-changes.one").replace("{{count}}", count),
			few: t("workspace.tooltip.has-changes.few").replace("{{count}}", count),
			many: t("workspace.tooltip.has-changes.many").replace("{{count}}", count),
		},
		false,
	);
};

interface WorkspaceItemProps {
	currentWorkspace: ClientWorkspaceConfig;
	workspace: ClientWorkspaceConfig;
	setDropdownOpen: (open: boolean) => void;
	showDot?: boolean;
}

const WorkspaceItem = ({ workspace, currentWorkspace, setDropdownOpen, showDot }: WorkspaceItemProps) => {
	const { name, path, icon } = workspace;

	const gesUrl = workspace.enterprise?.gesUrl;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { editInfo, isLoading } = useEnterpriseWorkspaceEdit({
		workspacePath: path,
		apiUrlCreator,
		gesUrl,
	});
	const disableEnterpriseEdit = gesUrl && !editInfo?.permitted;

	const workspaceName = name?.length > 20 ? name.slice(0, 20) + "..." : name;

	return (
		<DropdownMenuItem
			className="workspace-item"
			data-qa="qa-clickable"
			key={path}
			onClick={async () => {
				await WorkspaceService.setActive(path, apiUrlCreator);
				SourceDataService.refresh();
			}}
		>
			<MenuItemInteractiveTemplate
				icon={icon}
				indicator={showDot}
				indicatorClassName="bg-status-error"
				text={workspaceName}
				indicatorTooltip={showDot && t("available-changes-sync")}
				isSelected={path === currentWorkspace.path}
				buttonIcon={isLoading ? "loader" : disableEnterpriseEdit ? "pen-off" : "pen"}
				buttonDisabled={disableEnterpriseEdit}
				disabledTooltip={editInfo?.tooltip}
				buttonOnClick={(e) => {
					if (editInfo.permitted) {
						return resolveModule("openInWeb")(editInfo.href);
					}
					setDropdownOpen(false);
					e.stopPropagation();
					ModalToOpenService.setValue(ModalToOpen.EditWorkspaceForm, {
						workspace,
					});
				}}
			/>
		</DropdownMenuItem>
	);
};

const SwitchWorkspace = () => {
	const { isBrowser } = usePlatform();
	const isEnterprise = PageDataContextService.value.conf.enterprise.gesUrl;
	const isMobile = isMobileService.value;
	const syncableWorkspaces = useSyncableWorkspaces();
	const workspaces = WorkspaceService.workspaces();
	const currentWorkspace = WorkspaceService.current();
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const showDot = syncableWorkspaces.hasSyncableWorkspaces;

	return (
		<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
			{isMobile ? (
				<DropdownMenuTriggerButton
					variant="ghost"
					className="relative aspect-square p-2"
					size="lg"
					data-qa="qa-clickable"
				>
					{showDot && (
						<DropdownIndicator className="h-1.5 w-1.5 rounded-full absolute m-0.5 bg-status-error left-[23px] top-1" />
					)}
					<Icon icon="layers" size="lg" />
				</DropdownMenuTriggerButton>
			) : (
				<DropdownMenuTriggerButton variant="ghost" data-qa="qa-clickable" className="relative pl-3 pr-2">
					{showDot && (
						<DropdownIndicator className="h-1.5 w-1.5 rounded-full absolute m-0.5 bg-status-error left-[23px] top-1" />
					)}
					<Icon icon="layers" />
					{currentWorkspace.name}
					<Icon icon="chevrons-up-down" />
				</DropdownMenuTriggerButton>
			)}
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					{!(isEnterprise && isBrowser) && (
						<>
							<DropdownMenuItem
								data-qa="qa-clickable"
								onClick={() => ModalToOpenService.setValue(ModalToOpen.CreateWorkspaceForm)}
							>
								<Icon icon="plus" />
								{t("workspace.add")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{workspaces.map((workspace) => {
						if (isEnterprise && isBrowser && !workspace.enterprise?.gesUrl) return null;
						const tooltip = formatTooltip(workspace.path, null, syncableWorkspaces);
						const showDot = syncableWorkspaces.syncableWorkspaces[workspace.path] > 0;

						const Item = (
							<WorkspaceItem
								showDot={showDot}
								key={workspace.path}
								workspace={workspace}
								currentWorkspace={currentWorkspace}
								setDropdownOpen={setDropdownOpen}
							/>
						);
						if (!tooltip) return Item;

						return (
							<Tooltip key={workspace.path} content={tooltip}>
								{Item}
							</Tooltip>
						);
					})}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchWorkspace;
