import ContextService from "@core-ui/ContextServices/ContextService";
import { useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useLayoutEffect, useState } from "react";
import isMobileFunction from "../utils/IsMobile";

const IsMobileContext = createContext<boolean>(undefined);

class IsMobileService implements ContextService<boolean> {
	private _setIsMobile: Dispatch<SetStateAction<boolean>>;

	Init({ children }: { children: ReactElement }): ReactElement {
		const isMobileByCSS = useBreakpoint() === "sm";
		const [isMobile, setIsMobile] = useState<boolean>(isMobileByCSS);
		this._setIsMobile = setIsMobile;

		useLayoutEffect(() => {
			if (typeof window === "undefined") return;
			setIsMobile(isMobileByCSS || isMobileFunction({ ua: navigator.userAgent }));
		}, [isMobileByCSS]);

		return <IsMobileContext.Provider value={isMobile}>{children}</IsMobileContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: boolean }): ReactElement {
		return <IsMobileContext.Provider value={value}>{children}</IsMobileContext.Provider>;
	}

	get value(): boolean {
		return useContext(IsMobileContext);
	}

	set value(value: boolean) {
		this._setIsMobile?.(value);
	}
}

export default new IsMobileService();
