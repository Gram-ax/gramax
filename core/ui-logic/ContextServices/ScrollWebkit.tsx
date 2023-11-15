import { useMediaQuery } from "@mui/material";
import { createContext, ReactElement, useContext, useEffect, useState } from "react";
import { cssMedia } from "../utils/cssUtils";
import IsMacService from "./IsMac";

const ScrollWebkitContext = createContext<boolean>(undefined);

abstract class ScrollWebkitService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [useDefaultScrollBar, setUseDefaultScrollBar] = useState(false);
		const narrowMedia = useMediaQuery(cssMedia.JSnarrow);
		const isMac = IsMacService.value;

		useEffect(() => {
			if (window) {
				if (!useDefaultScrollBar) document.body.className = "scrollbar-webkit-all";
				else document.body.className = "";
			}
		}, [useDefaultScrollBar]);

		useEffect(() => {
			setUseDefaultScrollBar(isMac || narrowMedia);
		}, [isMac, narrowMedia]);

		return <ScrollWebkitContext.Provider value={useDefaultScrollBar}>{children}</ScrollWebkitContext.Provider>;
	}

	static get value(): boolean {
		return useContext(ScrollWebkitContext);
	}
}
export default ScrollWebkitService;
