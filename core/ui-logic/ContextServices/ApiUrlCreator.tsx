import { createContext, ReactElement, useContext } from "react";
import ApiUrlCreator from "../ApiServices/ApiUrlCreator";

const ApiUrlCreatorContext = createContext<ApiUrlCreator>(undefined);

abstract class ApiUrlCreatorService {
	static Provider({ children, value }: { children: ReactElement; value: ApiUrlCreator }): ReactElement {
		return <ApiUrlCreatorContext.Provider value={value}>{children}</ApiUrlCreatorContext.Provider>;
	}

	static get value(): ApiUrlCreator {
		return useContext(ApiUrlCreatorContext);
	}
}

export default ApiUrlCreatorService;
