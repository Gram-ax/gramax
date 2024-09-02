import Modal from "@components/Layouts/Modal";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
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
			trigger={
				<ButtonLink onClick={() => {}} iconViewBox="3 3 18 18" iconCode="plus" text={t("workspace.add")} />
			}
		>
			<WorkspaceForm onSave={() => setIsOpen(false)} create />
		</Modal>
	);
};

export default AddWorkspace;
