import ModalLayout from "@components/Layouts/Modal";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import DefaultError from "../../logic/DefaultError";
import GetErrorComponent from "../../logic/GetErrorComponent";
import ErrorConfirmService from "../ErrorConfirmService";

const ErrorModal = ({ error, setError }: { error: DefaultError; setError: Dispatch<SetStateAction<Error>> }) => {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		setIsOpen(!!error);
	}, [error]);

	const onClose = () => {
		setError(null);
		setIsOpen(false);
	};

	if (error?.props?.errorCode === "silent") return null;

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={async () => {
				setIsOpen(true);
				if (ErrorConfirmService.onModalOpen) await ErrorConfirmService.onModalOpen();
			}}
			onClose={async () => {
				if (ErrorConfirmService.onModalClose) await ErrorConfirmService.onModalClose();
				onClose();
			}}
		>
			<GetErrorComponent error={error} onCancelClick={onClose} />
		</ModalLayout>
	);
};

export default ErrorModal;
