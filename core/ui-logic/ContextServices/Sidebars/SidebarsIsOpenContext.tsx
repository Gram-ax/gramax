import isMobileService from "@core-ui/ContextServices/isMobileService";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { cssMedia } from "@core-ui/utils/cssUtils";
import {
	createContext,
	type Dispatch,
	type ReactElement,
	type SetStateAction,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import SidebarsIsPinService from "./SidebarsIsPin";

const SidebarsIsOpenContext = createContext<{ left: boolean; right: boolean }>(undefined);
const LeftNavigationTransitionEndLeftContext = createContext<boolean>(undefined);
const LeftNavigationTransitionEndRightContext = createContext<boolean>(undefined);

let SetIsLeftOpen: Dispatch<SetStateAction<boolean>>;
let SetIsRightOpen: Dispatch<SetStateAction<boolean>>;

let SetTransitionEndIsLeftOpen: Dispatch<SetStateAction<boolean>>;
let SetTransitionEndIsRightOpen: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsOpenService {
	private static _isMobile = false;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMobile = isMobileService.value;
		const isMedium = useMediaQuery(cssMedia.JSmedium);

		const [isLeftOpen, setIsLeftOpen] = useState(true);
		const [isRightOpen, setIsRightOpen] = useState(true);
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

		SetIsLeftOpen = setIsLeftOpen;
		SetIsRightOpen = setIsRightOpen;

		SetTransitionEndIsLeftOpen = setTransitionEndIsLeftOpen;
		SetTransitionEndIsRightOpen = setTransitionEndIsRightOpen;

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
		if (!SetIsLeftOpen || !SetIsRightOpen) return;
		const isSetLeft = typeof props?.left === "boolean";
		const isSetRight = typeof props?.right === "boolean";

		if (SidebarsIsOpenService._isMobile) {
			if (isSetLeft && props.left) {
				SetIsLeftOpen(true);
				SetIsRightOpen(false);
			} else if (isSetLeft && !props.left) SetIsLeftOpen(false);

			if (isSetRight && props.right) {
				SetIsRightOpen(true);
				SetIsLeftOpen(false);
			} else if (isSetRight && !props.right) SetIsRightOpen(false);
		} else {
			if (isSetLeft) SetIsLeftOpen(props.left);
			if (isSetRight) SetIsRightOpen(props.right);
		}
	}

	static get transitionEndIsLeftOpen(): boolean {
		return useContext(LeftNavigationTransitionEndLeftContext);
	}

	static set transitionEndIsLeftOpen(isOpen: boolean) {
		if (SetTransitionEndIsLeftOpen) SetTransitionEndIsLeftOpen(isOpen);
	}

	static get transitionEndIsRightOpen(): boolean {
		return useContext(LeftNavigationTransitionEndRightContext);
	}

	static set transitionEndIsRightOpen(isOpen: boolean) {
		if (SetTransitionEndIsRightOpen) SetTransitionEndIsRightOpen(isOpen);
	}
}

export default SidebarsIsOpenService;
