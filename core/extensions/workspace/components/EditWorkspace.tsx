import Icon from "@components/Atoms/Icon";
import Modal from "@components/Layouts/Modal";
import { useModalConfirm } from "@core-ui/hooks/useModalConfirm";
import t from "@ext/localization/locale/translate";
import WorkspaceForm from "@ext/workspace/components/WorkspaceForm";
import { ClientWorkspaceConfig } from "@ext/workspace/WorkspaceConfig";
import { useState, useCallback } from "react";

export interface ConfirmProps {
	saveChangesHandler?: () => void;
	setHaveChanges?: (v: boolean) => void;
	isOpenConfirm: boolean;
	useSaveCallback: (callback: () => any) => void;
	shouldOpenConfirmOnClose: () => boolean;
	clearData: () => void;
	closeConfirm: () => void;
}

const EditWorkspace = ({ workspace }: { workspace: ClientWorkspaceConfig }) => {
	const [isOpen, setIsOpen] = useState(false);

	const { setHaveChanges, saveChangesHandler, clearData, useSaveCallback, ...confirmProps } = useModalConfirm();

	const forceCloseModal = useCallback(() => {
		setIsOpen(false);
		clearData();
	}, [clearData]);

	const onOpen = useCallback(() => {
		setIsOpen(true);
	}, []);

	return (
		<Modal
			closeOnEscape
			onOpen={onOpen}
			onClose={forceCloseModal}
			isOpen={isOpen}
			trigger={<Icon isAction code="pen" />}
			confirmSaveAction={saveChangesHandler}
			confirmTitle={t("unsaved-changes")}
			forceCloseConfirm={forceCloseModal}
			confirmText={t("exit-edit-mode")}
			{...confirmProps}
		>
			<WorkspaceForm
				useSaveWorkspaceCallback={useSaveCallback}
				setHaveChanges={setHaveChanges}
				closeCallback={forceCloseModal}
				workspace={workspace}
			/>
		</Modal>
	);
};

export default EditWorkspace;
