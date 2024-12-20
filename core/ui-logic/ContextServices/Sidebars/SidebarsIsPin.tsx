import { useMediaQuery } from "@mui/material";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useMemo, useState } from "react";
import { cssMedia } from "../../utils/cssUtils";

export interface SidebarsIsPinValue {
	left: boolean;
	right: boolean;
}

const SidebarsIsPinContext = createContext<SidebarsIsPinValue>(undefined);
const IsSidebarsDependentContext = createContext<boolean>(undefined);

let _setLeftIsPin: Dispatch<SetStateAction<boolean>>;
let _setRightIsPin: Dispatch<SetStateAction<boolean>>;

let _setIsSidebarsDependent: Dispatch<SetStateAction<boolean>>;

abstract class SidebarsIsPinService {
	private static readonly _localStorageName = "SidebarsIsPin";
	private static _mediumMedia = false;
	private static _isSidebarsDependent = true;

	static Provider({ children }: { children: ReactElement }): ReactElement {
		const isMedium = useMediaQuery(cssMedia.JSmedium);
		const [leftIsPin, setLeftIsPin] = useState(true);
		const [rightIsPin, setRightIsPin] = useState(true);

		const [isSidebarsDependent, setIsSidebarsDependent] = useState(true);

		const value = useMemo(() => ({ left: leftIsPin, right: rightIsPin }), [leftIsPin, rightIsPin]);
		SidebarsIsPinService._mediumMedia = isMedium;
		_setLeftIsPin = setLeftIsPin;
		_setRightIsPin = setRightIsPin;

		_setIsSidebarsDependent = setIsSidebarsDependent;

		useEffect(() => {
			setLeftIsPin(SidebarsIsPinService.localStorageLeftValue);
			setRightIsPin(SidebarsIsPinService.localStorageLeftValue);
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
		if (SidebarsIsPinService._mediumMedia) return { left: false, right: false };
		return useContext(SidebarsIsPinContext) ?? ({} as any);
	}

	static set value(props: { left: boolean; right?: boolean } | { left?: boolean; right: boolean }) {
		if (SidebarsIsPinService._mediumMedia) return;
		if (!_setLeftIsPin || !_setRightIsPin) return;
		if (typeof props?.left === "boolean") {
			SidebarsIsPinService.localStorageLeftValue = props.left;
			_setLeftIsPin(props.left);
			if (this._isSidebarsDependent) _setRightIsPin(props.left);
		}
		if (typeof props?.right === "boolean") {
			_setRightIsPin(props.right);
			if (this._isSidebarsDependent) _setLeftIsPin(props.right);
		}
	}

	static get isSidebarsDependent(): boolean {
		return useContext(IsSidebarsDependentContext);
	}

	static set isSidebarsDependent(value: boolean) {
		if (!_setIsSidebarsDependent || typeof value !== "boolean") return;
		this._isSidebarsDependent = value;
		_setIsSidebarsDependent(value);
	}

	static get localStorageLeftValue(): boolean {
		return window.localStorage.getItem(SidebarsIsPinService._localStorageName) !== "false";
	}

	private static set localStorageLeftValue(value: boolean) {
		window.localStorage.setItem(SidebarsIsPinService._localStorageName, `${value}`);
	}
}
export default SidebarsIsPinService;
