/** biome-ignore-all lint/complexity/noStaticOnlyClass: it's ok */
import { isNetworkErrorPayload } from "@ext/errorHandlers/network/NetworkErrorPayload";
import { type Dispatch, type ReactElement, type SetStateAction, useState } from "react";
import type DefaultError from "../logic/DefaultError";
import ErrorModal from "./components/ErrorModal";

let SetError: Dispatch<SetStateAction<DefaultError>>;

abstract class ErrorConfirmService {
	private static _isWork: boolean;
	private static _onClose: () => Promise<void>;
	private static _onOpen: () => Promise<void>;

	static start() {
		ErrorConfirmService._isWork = true;
	}

	static stop() {
		ErrorConfirmService._isWork = false;
	}

	static Provider({ children }: { children: ReactElement }): ReactElement {
		ErrorConfirmService.start();
		const [error, setError] = useState<DefaultError>(null);
		SetError = setError;

		return (
			<>
				<ErrorModal error={error} setError={setError} />
				{children}
			</>
		);
	}

	static set onModalOpen(onOpen: () => Promise<void>) {
		this._onOpen = async () => {
			if (!onOpen) return;
			await onOpen();
			ErrorConfirmService.onModalOpen = undefined;
		};
	}

	static get onModalOpen() {
		return this._onOpen;
	}

	static set onModalClose(onClose: () => Promise<void>) {
		this._onClose = async () => {
			if (!onClose) return;
			await onClose();
			ErrorConfirmService.onModalClose = undefined;
		};
	}

	static get onModalClose() {
		return this._onClose;
	}

	static notify(error: DefaultError) {
		if (!this._isWork) return;
		if (this._errorFilter(error)) return;
		if (!SetError) throw new Error("ErrorConfirmService error: no '_setError'");
		SetError(error);
	}

	private static _errorFilter(error: DefaultError): boolean {
		return isNetworkErrorPayload(error);
	}
}

export default ErrorConfirmService;
