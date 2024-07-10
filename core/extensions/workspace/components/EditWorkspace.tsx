import Icon from "@components/Atoms/Icon";
import Modal from "@components/Layouts/Modal";
import WorkspaceForm from "@ext/workspace/components/WorkspaceForm";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useState } from "react";

const EditWorkspace = ({ workspace }: { workspace: ClientWorkspaceConfig }) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Modal
			closeOnEscape
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
			isOpen={isOpen}
			trigger={<Icon isAction code="pen" />}
		>
			<WorkspaceForm workspace={workspace} onSave={() => setIsOpen(false)} />
		</Modal>
	);
};

export default EditWorkspace;
