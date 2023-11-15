import { useMediaQuery } from "@mui/material";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import { cssMedia } from "../utils/cssUtils";

const SidebarsIsPinContext = createContext<boolean>(undefined);
let _setValue: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsPinService {
	private static _mediumMedia = false;
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMedium = useMediaQuery(cssMedia.JSmedium);
		const localStorageName = SidebarsIsPinService.localStorageName;
		const [value, setValue] = useState<boolean>(!isMedium);
		SidebarsIsPinService._mediumMedia = isMedium;
		_setValue = setValue;

		useEffect(() => {
			if (isMedium) setValue(false);
		}, [isMedium]);

		useEffect(() => {
			if (isMedium) return;
			setValue(window.localStorage.getItem(localStorageName) !== "false");
		}, []);

		useEffect(() => {
			window.localStorage.setItem(localStorageName, `${value}`);
		}, [value]);

		return <SidebarsIsPinContext.Provider value={value}>{children}</SidebarsIsPinContext.Provider>;
	}

	static get value(): boolean {
		return useContext(SidebarsIsPinContext);
	}

	static set value(isPin: boolean) {
		if (SidebarsIsPinService._mediumMedia) return;
		if (_setValue) _setValue(isPin);
	}

	static get localStorageName(): string {
		return "SidebarsIsPin";
	}
}
export default SidebarsIsPinService;
