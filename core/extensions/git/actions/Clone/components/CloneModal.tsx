import { getExecutingEnvironment } from "@app/resolveModule/env";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import type StorageData from "@ext/storage/models/StorageData";
import { Modal, ModalContent, ModalTrigger } from "@ui-kit/Modal";
import { useState } from "react";
import SelectStorageDataForm from "../../../../storage/components/SelectStorageDataForm";

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

	const handleSubmit = (storageData: GitStorageData) => {
		startClone({
			storageData,
			skipLfsPull: getExecutingEnvironment() == "browser" || getExecutingEnvironment() == "tauri" ? true : false,
		});
		onSubmit?.(storageData);
		closeForm();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) closeForm();
	};

	return (
		<Modal onOpenChange={onOpenChange} open={isOpen}>
			{trigger && <ModalTrigger asChild>{trigger}</ModalTrigger>}
			<ModalContent>
				<OnNetworkApiErrorService.Provider callback={() => closeForm()}>
					<>
						<SelectStorageDataForm
							{...props}
							onClose={() => closeForm()}
							onSubmit={handleSubmit}
							selectedStorage={selectedStorage}
						/>
					</>
				</OnNetworkApiErrorService.Provider>
			</ModalContent>
		</Modal>
	);
};

export default CloneModal;
