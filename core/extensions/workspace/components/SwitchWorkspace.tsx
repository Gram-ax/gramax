import { topMenuItemClassName } from "@components/HomePage/TopMenu";
import { classNames } from "@components/libs/classNames";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import {
	type UseSyncableWorkspacesReturn,
	useSyncableWorkspaces,
} from "@core-ui/ContextServices/SyncCount/useSyncableWorkspaces";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import type { Admin } from "@ext/enterprise/components/admin/Admin";
import { useEnterpriseWorkspaceEdit } from "@ext/enterprise/components/useEditEnterpriseWorkspace";
import t, { pluralize } from "@ext/localization/locale/translate";
import type CreateWorkspaceForm from "@ext/workspace/components/CreateWorkspaceForm";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import {
	DropdownIndicator,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { MenuItemInteractiveTemplate } from "@ui-kit/MenuItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ComponentProps, useState } from "react";

const formatTooltip = (
	workspace: WorkspacePath,
	currentWorkspace: WorkspacePath,
	data: UseSyncableWorkspacesReturn,
) => {
	if (workspace !== currentWorkspace && !data.syncableWorkspaces[workspace]) return null;

	const count = data.syncableWorkspaces[workspace];
	const workspaceCount = Object.keys(data.syncableWorkspaces).length;
	const totalCount = Object.values(data.syncableWorkspaces).reduce((acc, count) => acc + count, 0);

	if (currentWorkspace === workspace) {
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
			if (workspaceCount === 0) return null;

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
	showIndicator?: boolean;
	indicatorText?: string;
}

const WorkspaceItem = ({
	workspace,
	currentWorkspace,
	setDropdownOpen,
	showIndicator,
	indicatorText,
}: WorkspaceItemProps) => {
	const { name, path, icon } = workspace;

	const gesUrl = workspace.enterprise?.gesUrl;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { editInfo, isLoading } = useEnterpriseWorkspaceEdit({
		workspacePath: path,
		apiUrlCreator,
		gesUrl,
	});
	const disableEnterpriseEdit = gesUrl && !editInfo?.permitted;

	const workspaceName = name?.length > 20 ? `${name.slice(0, 20)}...` : name;

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
				buttonDisabled={disableEnterpriseEdit}
				buttonIcon={isLoading ? "loader" : disableEnterpriseEdit ? "pen-off" : "pen"}
				buttonOnClick={(e) => {
					setDropdownOpen(false);
					e.stopPropagation();
					e.preventDefault();

					if (editInfo.permitted) {
						setDropdownOpen(false);
						return ModalToOpenService.setValue<ComponentProps<typeof Admin>>(ModalToOpen.GesAdmin, {
							gesUrl,
							onClose: () => ModalToOpenService.resetValue(),
						});
					}

					setDropdownOpen(false);
					ModalToOpenService.setValue(ModalToOpen.EditWorkspaceForm, {
						workspace,
					});
				}}
				disabledTooltip={editInfo?.tooltip}
				icon={icon}
				indicator={showIndicator}
				indicatorClassName="bg-status-error"
				indicatorTooltip={showIndicator && indicatorText}
				isSelected={path === currentWorkspace.path}
				text={workspaceName}
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
		<DropdownMenu onOpenChange={setDropdownOpen} open={dropdownOpen}>
			{isMobile ? (
				<DropdownMenuTriggerButton
					className={classNames("relative aspect-square p-2", {}, [topMenuItemClassName])}
					data-qa="qa-clickable"
					data-testid="switch-workspace"
					size="lg"
					variant="ghost"
				>
					{showDot && (
						<DropdownIndicator className="h-1.5 w-1.5 rounded-full absolute m-0.5 bg-status-error left-[23px] top-1" />
					)}
					<Icon icon="layers" size="lg" />
				</DropdownMenuTriggerButton>
			) : (
				<DropdownMenuTriggerButton
					className={classNames("relative pl-3 pr-2", {}, [topMenuItemClassName])}
					data-qa="qa-clickable"
					data-testid="switch-workspace"
					variant="ghost"
				>
					{showDot && (
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="absolute left-[23px] top-1 h-1.5 w-1.5">
									<DropdownIndicator className="w-full h-full m-0.5 rounded-full bg-status-error" />
								</div>
							</TooltipTrigger>
							<TooltipContent side="right">
								{formatTooltip(currentWorkspace.path, currentWorkspace.path, syncableWorkspaces)}
							</TooltipContent>
						</Tooltip>
					)}
					<Icon icon="layers" />
					{currentWorkspace.name}
					<Icon icon="chevrons-up-down" />
				</DropdownMenuTriggerButton>
			)}
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					{workspaces.map((workspace) => {
						if (isEnterprise && isBrowser && !workspace.enterprise?.gesUrl) return null;
						const tooltip = formatTooltip(workspace.path, null, syncableWorkspaces);

						return (
							<WorkspaceItem
								currentWorkspace={currentWorkspace}
								indicatorText={tooltip}
								key={workspace.path}
								setDropdownOpen={setDropdownOpen}
								showIndicator={!!tooltip}
								workspace={workspace}
							/>
						);
					})}
					{!(isEnterprise && isBrowser) && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								data-qa="qa-clickable"
								onClick={() =>
									ModalToOpenService.setValue<ComponentProps<typeof CreateWorkspaceForm>>(
										ModalToOpen.CreateWorkspaceForm,
										{ onSubmit: () => SourceDataService.refresh() },
									)
								}
							>
								<Icon icon="plus" />
								{t("workspace.add")}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchWorkspace;
