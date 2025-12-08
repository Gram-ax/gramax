import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import { useState } from "react";
import SelectStorageDataForm from "../../../../storage/components/SelectStorageDataForm";
import { Modal, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import StorageData from "@ext/storage/models/StorageData";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";

interface CloneModalProps {
	title?: string;
	description?: string;
	trigger?: JSX.Element;
	selectedStorage?: string;
	onSubmit?: (storageData: StorageData) => void;
	onClose?: () => void;
}

const CloneModal = ({ trigger, onClose, selectedStorage, onSubmit, ...props }: CloneModalProps) => {
	const [isOpen, setIsOpen] = useState(!trigger);
	const { isNext } = usePlatform();
	const { startClone } = useCloneRepo({
		skipCheck: true,
		isBare: isNext,
		onError: () => {
			refreshPage();
		},
		onStart: () => {
			refreshPage();
		},
	});

	const closeForm = () => {
		setIsOpen(false);
		onClose?.();
	};

	const handleSubmit = (storageData: StorageData) => {
		startClone({
			storageData,
		});
		onSubmit?.(storageData);
		closeForm();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) closeForm();
	};

	return (
		<Modal open={isOpen} onOpenChange={onOpenChange}>
			{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
			<ModalContent>
				<OnNetworkApiErrorService.Provider callback={() => closeForm()}>
					<SelectStorageDataForm
						{...props}
						onSubmit={handleSubmit}
						selectedStorage={selectedStorage}
						onClose={() => closeForm()}
					/>
				</OnNetworkApiErrorService.Provider>
			</ModalContent>
		</Modal>
	);
};

export default CloneModal;
