import isMobileService from "@core-ui/ContextServices/isMobileService";
import useMediaQuery from "@core-ui/hooks/useMediaQuery";
import {
	createContext,
	type Dispatch,
	type ReactElement,
	type SetStateAction,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { cssMedia } from "../../utils/cssUtils";

export interface SidebarsIsPinValue {
	left: boolean;
	right: boolean;
}

const SidebarsIsPinContext = createContext<SidebarsIsPinValue>(undefined);
const IsSidebarsDependentContext = createContext<boolean>(undefined);

let SetLeftIsPin: Dispatch<SetStateAction<boolean>>;
let SetRightIsPin: Dispatch<SetStateAction<boolean>>;

let SetIsSidebarsDependent: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsPinService {
	private static readonly _localStorageName = "SidebarsIsPin";
	private static _mediumMedia = false;
	private static _isSidebarsDependent = true;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMedium = useMediaQuery(cssMedia.JSmedium);
		const isMobile = isMobileService.value;
		const [leftIsPin, setLeftIsPin] = useState(true);
		const [rightIsPin, setRightIsPin] = useState(true);

		const [isSidebarsDependent, setIsSidebarsDependent] = useState(true);

		const value = useMemo(() => ({ left: leftIsPin, right: rightIsPin }), [leftIsPin, rightIsPin]);
		SidebarsIsPinService._mediumMedia = isMedium;
		SetLeftIsPin = setLeftIsPin;
		SetRightIsPin = setRightIsPin;

		SetIsSidebarsDependent = setIsSidebarsDependent;

		useEffect(() => {
			setLeftIsPin(isMedium || isMobile ? false : SidebarsIsPinService.localStorageLeftValue);
			setRightIsPin(isMedium || isMobile ? false : SidebarsIsPinService.localStorageLeftValue);
		}, []);

		return (
			<SidebarsIsPinContext.Provider value={value}>
				<IsSidebarsDependentContext.Provider value={isSidebarsDependent}>
					{children}
				</IsSidebarsDependentContext.Provider>
			</SidebarsIsPinContext.Provider>
		);
	}

	static get value(): { left: boolean; right: boolean } {
		const value = useContext(SidebarsIsPinContext);
		if (SidebarsIsPinService._mediumMedia) return { left: false, right: false };
		return value ?? ({} as any);
	}

	static set value(props: { left: boolean; right?: boolean } | { left?: boolean; right: boolean }) {
		if (SidebarsIsPinService._mediumMedia) return;
		if (!SetLeftIsPin || !SetRightIsPin) return;
		if (typeof props?.left === "boolean") {
			SidebarsIsPinService.localStorageLeftValue = props.left;
			SetLeftIsPin(props.left);
			if (this._isSidebarsDependent) SetRightIsPin(props.left);
		}
		if (typeof props?.right === "boolean") {
			SetRightIsPin(props.right);
			if (this._isSidebarsDependent) SetLeftIsPin(props.right);
		}
	}

	static get isSidebarsDependent(): boolean {
		return useContext(IsSidebarsDependentContext);
	}

	static set isSidebarsDependent(value: boolean) {
		if (!SetIsSidebarsDependent || typeof value !== "boolean") return;
		this._isSidebarsDependent = value;
		SetIsSidebarsDependent(value);
	}

	static get localStorageLeftValue(): boolean {
		return window.localStorage.getItem(SidebarsIsPinService._localStorageName) !== "false";
	}

	private static set localStorageLeftValue(value: boolean) {
		window.localStorage.setItem(SidebarsIsPinService._localStorageName, `${value}`);
	}
}
export default SidebarsIsPinService;
