import { ReactElement, createContext, useContext, useState } from "react";

type IsMenuBarOpenContextType = {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
};

const IsMenuBarOpenContext = createContext<IsMenuBarOpenContextType>(undefined);

abstract class IsMenuBarOpenService {
	static Provider({ children }: { children: ReactElement }) {
		const [isOpen, setIsOpen] = useState(false);

		return <IsMenuBarOpenContext.Provider value={{ isOpen, setIsOpen }}>{children}</IsMenuBarOpenContext.Provider>;
	}

	static get value() {
		const context = useContext(IsMenuBarOpenContext);
		return context;
	}
}

export default IsMenuBarOpenService;
export { IsMenuBarOpenContext };
