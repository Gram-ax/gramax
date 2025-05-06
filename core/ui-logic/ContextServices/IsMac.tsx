import ContextService from "@core-ui/ContextServices/ContextService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";

const IsMacContext = createContext<boolean>(undefined);

class IsMacService implements ContextService<boolean> {
	private _setIsMac: Dispatch<SetStateAction<boolean>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const [isMac, setIsMac] = useState<boolean>(undefined);
		this._setIsMac = setIsMac;

		useEffect(() => {
			if (typeof window === "undefined") return;
			setIsMac(navigator.userAgent.includes("Mac"));
		}, []);

		return <IsMacContext.Provider value={isMac}>{children}</IsMacContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: boolean }): ReactElement {
		return <IsMacContext.Provider value={value}>{children}</IsMacContext.Provider>;
	}

	get value(): boolean {
		return useContext(IsMacContext);
	}

	set value(value: boolean) {
		this._setIsMac?.(value);
	}
}

export default new IsMacService();
