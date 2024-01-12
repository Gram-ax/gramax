import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useEffect, useState } from "react";

export const IsOfflineContext = createContext<boolean>(undefined);
let _setIsOffline: Dispatch<SetStateAction<boolean>>;

abstract class IsOfflineService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [isOffline, setIsOffline] = useState<boolean>(null);
		_setIsOffline = setIsOffline;

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

	static get value(): boolean {
		return useContext(IsOfflineContext);
	}

	static set value(value: boolean) {
		_setIsOffline(value);
	}
}

export default IsOfflineService;
