import Icon from "@components/Atoms/Icon";
import EditWorkspaceForm from "@ext/workspace/components/EditWorkspaceForm";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { SetStateAction, Dispatch } from "react";

interface EditWorkspaceProps {
	workspace: ClientWorkspaceConfig;
	onOpenChange: Dispatch<SetStateAction<boolean>>;
}

const EditWorkspace = ({ workspace, onOpenChange }: EditWorkspaceProps) => {
	return (
		<EditWorkspaceForm
			key={workspace?.path}
			workspace={workspace}
			onOpenChange={onOpenChange}
			trigger={<Icon onClick={(e) => e.stopPropagation()} isAction code="pen" />}
		/>
	);
};

export default EditWorkspace;
