import { Environment } from "@app/resolveModule/env";
import { createContext, ReactElement, useContext } from "react";

const PlatformContext = createContext<Environment>(undefined);

abstract class PlatformService {
	static Provider({ children, value }: { children: ReactElement; value: Environment }): ReactElement {
		return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
	}

	static get value(): Environment {
		return useContext(PlatformContext);
	}
}

export default PlatformService;
