import { Dispatch, ReactElement, SetStateAction, createContext, useContext, useState } from "react";

export const IsMenuBarOpenContext = createContext<boolean>(undefined);
let _setIsMenuBarOpen: Dispatch<SetStateAction<boolean>>;

abstract class IsMenuBarOpenService {
	static Provider({ children }: { children: ReactElement }): ReactElement {
		const [isOpen, setIsOpen] = useState<boolean>(true);
		_setIsMenuBarOpen = setIsOpen;
		return <IsMenuBarOpenContext.Provider value={isOpen}>{children}</IsMenuBarOpenContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsMenuBarOpenContext);
	}

	static set value(value: boolean) {
		_setIsMenuBarOpen(value);
	}
}

export default IsMenuBarOpenService;
