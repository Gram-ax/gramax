import ErrorConfirmService from "@ext/errorHandlers/client/ErrorConfirmService";
import NetworkApiError from "@ext/errorHandlers/network/NetworkApiError";
import { ReactElement, createContext, useCallback, useContext } from "react";

export type OnNetworkApiErrorHandler = (error: NetworkApiError) => void;
const OnNetworkApiErrorContext = createContext<OnNetworkApiErrorHandler>(undefined);

abstract class OnNetworkApiErrorService {
	static Provider({ children, callback }: { children: ReactElement; callback?: () => void }): ReactElement {
		const onNetworkApiError = useCallback(
			(error: NetworkApiError) => {
				if (!ErrorConfirmService?.notify) return;
				ErrorConfirmService.notify(error);
				callback?.();
			},
			// eslint-disable-next-line @typescript-eslint/unbound-method
			[ErrorConfirmService?.notify],
		);

		return (
			<OnNetworkApiErrorContext.Provider value={onNetworkApiError}>{children}</OnNetworkApiErrorContext.Provider>
		);
	}

	static get value(): OnNetworkApiErrorHandler {
		return useContext(OnNetworkApiErrorContext);
	}
}

export default OnNetworkApiErrorService;
