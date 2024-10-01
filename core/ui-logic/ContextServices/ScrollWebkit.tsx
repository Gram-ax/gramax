import { useMediaQuery } from "@mui/material";
import { createContext, ReactElement, useContext, useEffect, useMemo } from "react";
import { cssMedia } from "../utils/cssUtils";
import IsMacService from "./IsMac";

const ScrollWebkitContext = createContext<boolean>(undefined);

abstract class ScrollWebkitService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
		const isMac = IsMacService.value;
		const useDefaultScrollBar = useMemo(() => isMac || narrowMedia, [isMac, narrowMedia]);

		useEffect(() => {
			if (window) {
				if (!useDefaultScrollBar) document.body.className = "scrollbar-webkit-all";
				else document.body.className = "";
			}
		}, [useDefaultScrollBar]);

		return <ScrollWebkitContext.Provider value={useDefaultScrollBar}>{children}</ScrollWebkitContext.Provider>;
	}

	static get value(): boolean {
		return useContext(ScrollWebkitContext);
	}
}
export default ScrollWebkitService;
