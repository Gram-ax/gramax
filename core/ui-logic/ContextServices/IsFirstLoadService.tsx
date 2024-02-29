import { ReactElement, createContext, useContext } from "react";

const IsFirstLoadServiceContext = createContext<boolean>(undefined);

abstract class IsFirstLoadService {
	static Provider({ children, value }: { children: ReactElement; value: boolean }): ReactElement {
		return <IsFirstLoadServiceContext.Provider value={value}>{children}</IsFirstLoadServiceContext.Provider>;
	}

	static get value(): boolean {
		return useContext(IsFirstLoadServiceContext);
	}
}

export default IsFirstLoadService;
