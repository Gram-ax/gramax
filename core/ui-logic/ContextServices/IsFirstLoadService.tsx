import { ReactElement, createContext, useContext } from "react";

const IsFirstLoadServiceContext = createContext<boolean>(undefined);

abstract class IsFirstLoadService {
	private static _resetIsFirstLoad: () => void;

	static Provider({
		children,
		value,
		resetIsFirstLoad,
	}: {
		children: ReactElement;
		value: boolean;
		resetIsFirstLoad: () => void;
	}): ReactElement {
		IsFirstLoadService._resetIsFirstLoad = resetIsFirstLoad;
		if (typeof window !== "undefined") window.resetIsFirstLoad = resetIsFirstLoad;
		return <IsFirstLoadServiceContext.Provider value={value}>{children}</IsFirstLoadServiceContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsFirstLoadServiceContext);
	}

	static resetValue(): void {
		this._resetIsFirstLoad?.();
	}
}

export default IsFirstLoadService;
