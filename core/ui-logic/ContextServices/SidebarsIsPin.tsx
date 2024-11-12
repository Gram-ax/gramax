import { useMediaQuery } from "@mui/material";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import { cssMedia } from "../utils/cssUtils";

const SidebarsIsPinContext = createContext<boolean>(undefined);
let _setValue: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsPinService {
	private static readonly _localStorageName = "SidebarsIsPin";
	private static _mediumMedia = false;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMedium = useMediaQuery(cssMedia.JSmedium);
		const [value, setValue] = useState<boolean>(true);
		SidebarsIsPinService._mediumMedia = isMedium;
		_setValue = setValue;

		useEffect(() => {
			setValue(SidebarsIsPinService.localStorageValue);
		}, []);

		return <SidebarsIsPinContext.Provider value={value}>{children}</SidebarsIsPinContext.Provider>;
	}

	static get value(): boolean {
		if (SidebarsIsPinService._mediumMedia) return false;
		return useContext(SidebarsIsPinContext);
	}

	static set value(isPin: boolean) {
		if (SidebarsIsPinService._mediumMedia) return;
		if (_setValue) {
			_setValue(isPin);
			SidebarsIsPinService.localStorageValue = isPin;
		}
	}

	static get localStorageValue(): boolean {
		return window.localStorage.getItem(SidebarsIsPinService._localStorageName) !== "false";
	}

	private static set localStorageValue(value: boolean) {
		window.localStorage.setItem(SidebarsIsPinService._localStorageName, `${value}`);
	}
}
export default SidebarsIsPinService;
