import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import DefaultError from "../logic/DefaultError";
import ErrorModal from "./components/ErrorModal";

let _setError: Dispatch<SetStateAction<DefaultError>>;

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
		_setError = setError;

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
		_setError(error);
		if (!_setError) throw new Error("ErrorConfirmService error: no '_setError'");
		_setError(error);
	}
}

export default ErrorConfirmService;
