import ModalLayout from "@components/Layouts/Modal";
import canShowVersion from "@core/utils/canShowVersion";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import type DefaultError from "../../logic/DefaultError";
import GetErrorComponent from "../../logic/GetErrorComponent";
import ErrorConfirmService from "../ErrorConfirmService";

const ErrorModal = ({ error, setError }: { error: DefaultError; setError: Dispatch<SetStateAction<Error>> }) => {
	const [isOpen, setIsOpen] = useState(false);
	const { conf, isLogged } = PageDataContextService.value ?? {};
	const canShowVer = !!conf && canShowVersion(conf?.enterprise?.gesUrl, isLogged);
	const appVer = canShowVer ? error?.props?.version : undefined;
	const appVersionLabel = appVer ? `${t("version")} ${appVer}` : undefined;

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
			onClose={async (close) => {
				if (ErrorConfirmService.onModalClose) await ErrorConfirmService.onModalClose();
				onClose(close);
			}}
			onOpen={async () => {
				setIsOpen(true);
				if (ErrorConfirmService.onModalOpen) await ErrorConfirmService.onModalOpen();
			}}
		>
			<GetErrorComponent appVersionLabel={appVersionLabel} error={error} onCancelClick={onClose} />
		</ModalLayout>
	);
};

export default ErrorModal;
