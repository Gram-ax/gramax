import canShowVersion from "@core/utils/canShowVersion";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import t from "@ext/localization/locale/translate";
import { Dialog } from "@ui-kit/Dialog";
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

	const onClose = async (close?: (v: boolean) => void) => {
		if (ErrorConfirmService.onModalClose) await ErrorConfirmService.onModalClose();
		setError(null);
		setIsOpen(false);
		if (close && typeof close === "function") close(true);
	};

	const onOpen = async () => {
		if (ErrorConfirmService.onModalOpen) await ErrorConfirmService.onModalOpen();
	};

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose();
		else onOpen();
	};

	if (error?.props?.errorCode === "silent") return null;

	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<GetErrorComponent appVersionLabel={appVersionLabel} error={error} onCancelClick={onClose} />
		</Dialog>
	);
};

export default ErrorModal;
