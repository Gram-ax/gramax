import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import UploadCloud from "@ext/static/components/UploadCloud";
import LoginGoogle from "@ext/static/components/LoginGoogle";
import Uploaded from "@ext/static/components/Uploaded";
import { useEffect, useRef, useState } from "react";
import { Modal, ModalContent } from "@ui-kit/Modal";
import CloudStateService from "@core-ui/ContextServices/CloudState";
import useWatch from "@core-ui/hooks/useWatch";

enum CloudModalState {
	loggedIn = "loggedIn",
	notLoggedIn = "notLoggedIn",
	uploaded = "uploaded",
}

const CloudModal = ({ onClose }: { onClose: () => void }) => {
	const { clientName, checkCatalogVersion, checkClientName } = CloudStateService.value;
	const [state, setState] = useState<CloudModalState>(
		clientName ? CloudModalState.loggedIn : CloudModalState.notLoggedIn,
	);
	const error = useRef<DefaultError>(null);

	useWatch(() => {
		if (state === CloudModalState.notLoggedIn && clientName) setState(CloudModalState.loggedIn);
		if (!clientName) setState(CloudModalState.notLoggedIn);
	}, [clientName]);

	const closeIfError = () => {
		if (!error.current) return;
		ErrorConfirmService.notify(error.current);
		error.current = null;
		onClose();
	};

	useEffect(closeIfError, []);

	return (
		<Modal
			open
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose();
				}
			}}
		>
			<ModalContent data-modal-root>
				{state === CloudModalState.notLoggedIn && (
					<LoginGoogle
						onLogin={() => {
							void checkClientName();
						}}
					/>
				)}
				{state === CloudModalState.loggedIn && (
					<UploadCloud
						onUpload={() => {
							checkCatalogVersion();
							setState(CloudModalState.uploaded);
						}}
					/>
				)}
				{state === CloudModalState.uploaded && <Uploaded />}
			</ModalContent>
		</Modal>
	);
};

export default CloudModal;
