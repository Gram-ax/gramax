import { useMediaQuery } from "@mui/material";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useMemo, useState } from "react";
import { cssMedia } from "../../utils/cssUtils";
import SidebarsIsPinService from "./SidebarsIsPin";

const SidebarsIsOpenContext = createContext<{ left: boolean; right: boolean }>(undefined);
const LeftNavigationTransitionEndLeftContext = createContext<boolean>(undefined);
const LeftNavigationTransitionEndRightContext = createContext<boolean>(undefined);

let _setIsLeftOpen: Dispatch<SetStateAction<boolean>>;
let _setIsRightOpen: Dispatch<SetStateAction<boolean>>;

let _setTransitionEndIsLeftOpen: Dispatch<SetStateAction<boolean>>;
let _setTransitionEndIsRightOpen: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsOpenService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMedium = useMediaQuery(cssMedia.JSmedium);

		const [isLeftOpen, setIsLeftOpen] = useState(false);
		const [isRightOpen, setIsRightOpen] = useState(false);
		const sideBarsIsOpen = useMemo(() => ({ left: isLeftOpen, right: isRightOpen }), [isLeftOpen, isRightOpen]);

		const [transitionEndIsLeftOpen, setTransitionEndIsLeftOpen] = useState(false);
		const [transitionEndIsRightOpen, setTransitionEndIsRightOpen] = useState(false);

		useEffect(() => {
			if (isMedium) return;
			setIsLeftOpen(SidebarsIsPinService.localStorageLeftValue);
			setIsRightOpen(SidebarsIsPinService.localStorageLeftValue);
			setTransitionEndIsLeftOpen(SidebarsIsPinService.localStorageLeftValue);
		}, []);

		useEffect(() => {
			if (SidebarsIsPinService.localStorageLeftValue) {
				setIsLeftOpen(!isMedium);
				setIsRightOpen(!isMedium);
				setTransitionEndIsLeftOpen(!isMedium);
				setTransitionEndIsRightOpen(!isMedium);
			}
		}, [isMedium]);

		_setIsLeftOpen = setIsLeftOpen;
		_setIsRightOpen = setIsRightOpen;

		_setTransitionEndIsLeftOpen = setTransitionEndIsLeftOpen;
		_setTransitionEndIsRightOpen = setTransitionEndIsRightOpen;

		return (
			<SidebarsIsOpenContext.Provider value={sideBarsIsOpen}>
				<LeftNavigationTransitionEndLeftContext.Provider value={transitionEndIsLeftOpen}>
					<LeftNavigationTransitionEndRightContext.Provider value={transitionEndIsRightOpen}>
						{children}
					</LeftNavigationTransitionEndRightContext.Provider>
				</LeftNavigationTransitionEndLeftContext.Provider>
			</SidebarsIsOpenContext.Provider>
		);
	}

	static get value(): { left: boolean; right: boolean } {
		return useContext(SidebarsIsOpenContext) ?? ({} as any);
	}

	static set value(props: { left: boolean; right?: boolean } | { left?: boolean; right: boolean }) {
		if (!_setIsLeftOpen || !_setIsRightOpen) return;
		if (typeof props?.left === "boolean") _setIsLeftOpen(props.left);
		if (typeof props?.right === "boolean") _setIsRightOpen(props.right);
	}

	static get transitionEndIsLeftOpen(): boolean {
		return useContext(LeftNavigationTransitionEndLeftContext);
	}

	static set transitionEndIsLeftOpen(isOpen: boolean) {
		if (_setTransitionEndIsLeftOpen) _setTransitionEndIsLeftOpen(isOpen);
	}

	static get transitionEndIsRightOpen(): boolean {
		return useContext(LeftNavigationTransitionEndRightContext);
	}

	static set transitionEndIsRightOpen(isOpen: boolean) {
		if (_setTransitionEndIsRightOpen) _setTransitionEndIsRightOpen(isOpen);
	}
}

export default SidebarsIsOpenService;
