import Icon from "@components/Atoms/Icon";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import type { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { DropdownMenuItem } from "@ui-kit/Dropdown";

interface SelectTargetWorkspace {
	onClick: (workspace: ClientWorkspaceConfig) => void;
	excludeCurrent?: boolean;
}

const SelectTargetWorkspace = ({ onClick: onSelect, excludeCurrent = true }: SelectTargetWorkspace) => {
	const currentWorkspace = WorkspaceService.current();
	const allWorkspaces = WorkspaceService.workspaces();

	const workspaces =
		excludeCurrent && currentWorkspace
			? allWorkspaces.filter((w) => w.path !== currentWorkspace.path)
			: allWorkspaces;

	return (
		<>
			{workspaces.map((workspace) => (
				<DropdownMenuItem
					key={workspace.path}
					onClick={(ev) => {
						ev.stopPropagation();
						onSelect(workspace);
					}}
				>
					<Icon code={workspace.icon || "layers"} />
					{workspace.name}
				</DropdownMenuItem>
			))}
		</>
	);
};

export default SelectTargetWorkspace;
