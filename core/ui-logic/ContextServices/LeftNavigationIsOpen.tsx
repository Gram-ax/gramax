import { useMediaQuery } from "@mui/material";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import { cssMedia } from "../utils/cssUtils";
import SidebarsIsPinService from "./SidebarsIsPin";

const LeftNavigationIsOpen = createContext<boolean>(undefined);
const LeftNavigationTransitionEndIsOpen = createContext<boolean>(undefined);
let _setValue: Dispatch<SetStateAction<boolean>>;
let _setTransitionEndValue: Dispatch<SetStateAction<boolean>>;
abstract class LeftNavigationIsOpenService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMedium = useMediaQuery(cssMedia.JSmedium);

		const [value, setValue] = useState(true);
		const [transitionEndValue, setTransitionEndValue] = useState(true);

		useEffect(() => {
			if (SidebarsIsPinService.localStorageValue) setValue(!isMedium);
		}, [isMedium]);

		useEffect(() => {
			setValue(SidebarsIsPinService.localStorageValue);
			setTransitionEndValue(SidebarsIsPinService.localStorageValue);
		}, []);

		_setValue = setValue;
		_setTransitionEndValue = setTransitionEndValue;

		return (
			<LeftNavigationIsOpen.Provider value={value}>
				<LeftNavigationTransitionEndIsOpen.Provider value={transitionEndValue}>
					{children}
				</LeftNavigationTransitionEndIsOpen.Provider>
			</LeftNavigationIsOpen.Provider>
		);
	}

	static get value(): boolean {
		return useContext(LeftNavigationIsOpen);
	}

	static set value(isOpen: boolean) {
		if (_setValue) _setValue(isOpen);
	}

	static get transitionEndIsOpen(): boolean {
		return useContext(LeftNavigationTransitionEndIsOpen);
	}

	static set transitionEndIsOpen(isOpen: boolean) {
		if (_setTransitionEndValue) _setTransitionEndValue(isOpen);
	}
}

export default LeftNavigationIsOpenService;
