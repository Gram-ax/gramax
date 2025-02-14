import Modal from "@components/Layouts/Modal";
import ButtonLink from "@components/Molecules/ButtonLink";
import t from "@ext/localization/locale/translate";
import WorkspaceForm from "@ext/workspace/components/WorkspaceForm";
import { useState, useCallback } from "react";

const AddWorkspace = () => {
	const [isOpen, setIsOpen] = useState(false);

	const closeModal = useCallback(() => {
		setIsOpen(false);
	}, []);

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	const voidCallback = useCallback(() => {}, []);

	return (
		<Modal
			closeOnEscape
			isOpen={isOpen}
			onOpen={onOpen}
			onClose={closeModal}
			trigger={
				<ButtonLink onClick={voidCallback} iconViewBox="3 3 18 18" iconCode="plus" text={t("workspace.add")} />
			}
		>
			<WorkspaceForm closeCallback={closeModal} create />
		</Modal>
	);
};

export default AddWorkspace;
