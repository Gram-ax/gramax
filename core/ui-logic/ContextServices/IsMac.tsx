import { createContext, ReactElement, useContext, useEffect, useState } from "react";

const IsMacContext = createContext<boolean>(undefined);

export default abstract class IsMacService {
	static Provider({ children, value }: { children: ReactElement; value: any }): ReactElement {
		const [isMac, setIsMac] = useState<boolean>(false);

		useEffect(() => {
			if (window) setIsMac(value.isMac ?? navigator.userAgent.includes("Mac"));
		}, [value.isMac]);

		return <IsMacContext.Provider value={isMac}>{children}</IsMacContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsMacContext);
	}
}
