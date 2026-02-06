import ContextService from "@core-ui/ContextServices/ContextService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";

export const IsOfflineContext = createContext<boolean>(undefined);

class IsOfflineService implements ContextService {
	private _setIsOffline: Dispatch<SetStateAction<boolean>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [isOffline, setIsOffline] = useState<boolean>(null);
		this._setIsOffline = setIsOffline;

		const isOnlineHandler = () => setIsOffline(false);
		const isOfflineHandler = () => setIsOffline(true);

		useEffect(() => {
			setIsOffline(!window.navigator.onLine);
			window.addEventListener("online", isOnlineHandler);
			window.addEventListener("offline", isOfflineHandler);
			return () => {
				window.removeEventListener("online", isOnlineHandler);
				window.removeEventListener("offline", isOfflineHandler);
			};
		}, []);
		return <IsOfflineContext.Provider value={isOffline}>{children}</IsOfflineContext.Provider>;
	}

	get value(): boolean {
		return useContext(IsOfflineContext);
	}

	set value(value: boolean) {
		this._setIsOffline(value);
	}
}

export default new IsOfflineService();
