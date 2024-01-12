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
		const [value, setValue] = useState(!isMedium);
		const [transitionEndValue, setTransitionEndValue] = useState(!isMedium);

		useEffect(() => {
			setValue(!isMedium);
			setTransitionEndValue(!isMedium);
		}, [isMedium]);

		_setValue = setValue;
		_setTransitionEndValue = setTransitionEndValue;

		useEffect(() => {
			const value = window.localStorage.getItem(SidebarsIsPinService.localStorageName);
			if (isMedium) return;
			if (typeof value !== "boolean") return;
			setValue(value === "true");
			setTransitionEndValue(value === "true");
		}, []);

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
