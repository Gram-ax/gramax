import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import ModalToOpen from "@core-ui/ContextServices/ModalToOpenService/model/ModalsToOpen";
import {
	useSyncableWorkspaces,
	type UseSyncableWorkspacesReturn,
} from "@core-ui/ContextServices/SyncCount/useSyncableWorkspaces";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import styled from "@emotion/styled";
import useEditEnterpriseWorkspace from "@ext/enterprise/components/useEditEnterpriseWorkspace";
import t, { pluralize } from "@ext/localization/locale/translate";
import type { ClientWorkspaceConfig, WorkspacePath } from "@ext/workspace/WorkspaceConfig";
import { MenuItemInteractiveTemplate } from "@ui-kit/MenuItem";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTriggerButton,
} from "ics-ui-kit/components/dropdown";
import { useState } from "react";

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

const IconWithDot = styled.div<{ showDot?: boolean }>`
	${({ showDot }) =>
		showDot &&
		`.workspace-item > i.icon::after {
			content: '';
			position: absolute;
			top: -2px;
			width: 3px;
			right: 0px;
			height: 3px;
			background-color: red;
			border-radius: 9999px;
		}

		.workspace-item > i.icon {
			position: relative;
		}
	`}
`;

interface WorkspaceItemProps {
	currentWorkspace: ClientWorkspaceConfig;
	workspace: ClientWorkspaceConfig;
	setDropdownOpen: (open: boolean) => void;
	showDot?: boolean;
}

const WorkspaceItem = ({ workspace, currentWorkspace, setDropdownOpen, showDot }: WorkspaceItemProps) => {
	const { name, path, icon } = workspace;

	const gesUrl = workspace.enterprise?.gesUrl;
	const editEnterpriseWorkspace = useEditEnterpriseWorkspace(workspace);
	const apiUrlCreator = ApiUrlCreatorService.value;

	const workspaceName = name?.length > 20 ? name.slice(0, 20) + "..." : name;

	return (
		<IconWithDot showDot={showDot}>
			<DropdownMenuItem
				className="workspace-item"
				data-qa="qa-clickable"
				key={path}
				onClick={() => {
					void WorkspaceService.setActive(path, apiUrlCreator);
				}}
			>
				<MenuItemInteractiveTemplate
					icon={icon}
					text={workspaceName}
					isSelected={name === currentWorkspace.name}
					buttonIcon={gesUrl ? (editEnterpriseWorkspace ? "pen" : undefined) : "pen"}
					buttonOnClick={(e) => {
						if (editEnterpriseWorkspace) {
							return window.open(editEnterpriseWorkspace.href, editEnterpriseWorkspace.target);
						}
						setDropdownOpen(false);
						e.stopPropagation();
						ModalToOpenService.setValue(ModalToOpen.EditWorkspaceForm, {
							workspace,
						});
					}}
				/>
			</DropdownMenuItem>
		</IconWithDot>
	);
};

const SwitchWorkspace = () => {
	const isMobile = isMobileService.value;
	const syncableWorkspaces = useSyncableWorkspaces();
	const workspaces = WorkspaceService.workspaces();
	const currentWorkspace = WorkspaceService.current();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	return (
		<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
			{isMobile ? (
				<DropdownMenuTriggerButton variant="ghost" className="aspect-square p-2" data-qa="qa-clickable">
					<Icon code="layers" />
				</DropdownMenuTriggerButton>
			) : (
				<DropdownMenuTriggerButton variant="ghost" data-qa="qa-clickable">
					<Icon code="layers" />
					{currentWorkspace.name}
					<Icon code="chevrons-up-down" />
				</DropdownMenuTriggerButton>
			)}
			<DropdownMenuContent align="start">
				<DropdownMenuGroup>
					<DropdownMenuItem
						data-qa="qa-clickable"
						onClick={() => ModalToOpenService.setValue(ModalToOpen.CreateWorkspaceForm)}
					>
						<Icon code="plus" />
						{t("workspace.add")}
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					{workspaces.map((workspace) => {
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
