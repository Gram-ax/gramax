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

	const onClose = (close?: (v: boolean) => void) => {
		setError(null);
		setIsOpen(false);
		if (close && typeof close === "function") close(true);
	};

	if (error?.props?.errorCode === "silent") return null;

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={async () => {
				setIsOpen(true);
				if (ErrorConfirmService.onModalOpen) await ErrorConfirmService.onModalOpen();
			}}
			onClose={async (close) => {
				if (ErrorConfirmService.onModalClose) await ErrorConfirmService.onModalClose();
				onClose(close);
			}}
		>
			<GetErrorComponent error={error} onCancelClick={onClose} />
		</ModalLayout>
	);
};

export default ErrorModal;
