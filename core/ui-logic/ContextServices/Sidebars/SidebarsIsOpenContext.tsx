import { usePlatform } from "@core-ui/hooks/usePlatform";
import {
	createContext,
	Dispatch,
	ReactElement,
	SetStateAction,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import SidebarsIsPinService from "./SidebarsIsPin";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import { useMediaQuery } from "@react-hook/media-query";
import { cssMedia } from "@core-ui/utils/cssUtils";

const SidebarsIsOpenContext = createContext<{ left: boolean; right: boolean }>(undefined);
const LeftNavigationTransitionEndLeftContext = createContext<boolean>(undefined);
const LeftNavigationTransitionEndRightContext = createContext<boolean>(undefined);

let _setIsLeftOpen: Dispatch<SetStateAction<boolean>>;
let _setIsRightOpen: Dispatch<SetStateAction<boolean>>;

let _setTransitionEndIsLeftOpen: Dispatch<SetStateAction<boolean>>;
let _setTransitionEndIsRightOpen: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsOpenService {
	private static _isMobile = false;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMobile = isMobileService.value;
		const isMedium = useMediaQuery(cssMedia.JSmedium);

		const [isLeftOpen, setIsLeftOpen] = useState(false);
		const [isRightOpen, setIsRightOpen] = useState(false);
		const sideBarsIsOpen = useMemo(() => ({ left: isLeftOpen, right: isRightOpen }), [isLeftOpen, isRightOpen]);
		const { isStatic, isStaticCli } = usePlatform();

		const [transitionEndIsLeftOpen, setTransitionEndIsLeftOpen] = useState(isStatic || isStaticCli);
		const [transitionEndIsRightOpen, setTransitionEndIsRightOpen] = useState(false);

		SidebarsIsOpenService._isMobile = isMobile;

		const isMediumOrMobile = isMedium || isMobile;
		const resetToValue = (value: boolean) => {
			setIsLeftOpen(value);
			setIsRightOpen(value);
			setTransitionEndIsLeftOpen(value);
			setTransitionEndIsRightOpen(value);
		};

		useLayoutEffect(() => {
			if (isMediumOrMobile) return resetToValue(false);
			if (typeof window === "undefined") return;
			resetToValue(SidebarsIsPinService.localStorageLeftValue);
		}, []);

		useEffect(() => {
			if (SidebarsIsPinService.localStorageLeftValue) resetToValue(!isMediumOrMobile);
		}, [isMediumOrMobile]);

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
		const isSetLeft = typeof props?.left === "boolean";
		const isSetRight = typeof props?.right === "boolean";

		if (SidebarsIsOpenService._isMobile) {
			if (isSetLeft && props.left) {
				_setIsLeftOpen(true);
				_setIsRightOpen(false);
			} else if (isSetLeft && !props.left) _setIsLeftOpen(false);

			if (isSetRight && props.right) {
				_setIsRightOpen(true);
				_setIsLeftOpen(false);
			} else if (isSetRight && !props.right) _setIsRightOpen(false);
		} else {
			if (isSetLeft) _setIsLeftOpen(props.left);
			if (isSetRight) _setIsRightOpen(props.right);
		}
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
