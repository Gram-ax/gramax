import Modal from "@components/Layouts/Modal";
import ButtonLink from "@components/Molecules/ButtonLink";
import useLocalize from "@ext/localization/useLocalize";
import WorkspaceForm from "@ext/workspace/components/WorkspaceForm";
import { useState } from "react";

const AddWorkspace = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Modal
			closeOnEscape
			isOpen={isOpen}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
			trigger={<ButtonLink onClick={() => {}} iconCode="plus" text={useLocalize("addWorkspace")} />}
		>
			<WorkspaceForm onSave={() => setIsOpen(false)} create />
		</Modal>
	);
};

export default AddWorkspace;
