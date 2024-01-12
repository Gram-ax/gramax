import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";

const IsMacContext = createContext<boolean>(undefined);

let _setIsMac: Dispatch<SetStateAction<boolean>>;
export default abstract class IsMacService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [isMac, setIsMac] = useState<boolean>(undefined);
		_setIsMac = setIsMac;
		useEffect(() => {
			if (isMac !== undefined) return;
			if (window) setIsMac(navigator.userAgent.includes("Mac"));
		}, [isMac]);

		return <IsMacContext.Provider value={isMac}>{children}</IsMacContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsMacContext);
	}

	static set value(value: boolean) {
		_setIsMac?.(value);
	}
}
