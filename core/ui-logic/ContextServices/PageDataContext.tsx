import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import PageDataContext from "../../logic/Context/PageDataContext";

let _setPageDataContext: Dispatch<SetStateAction<PageDataContext>>;

export const PageDataContextContext = createContext<PageDataContext>(undefined);

export default abstract class PageDataContextService {
	static Provider({ children, value }: { children: ReactElement; value: PageDataContext }): ReactElement {
		const [pageDataContext, setPageDataContext] = useState<PageDataContext>(value);
		_setPageDataContext = setPageDataContext;

		useEffect(() => {
			setPageDataContext(value);
		}, [value]);

		return <PageDataContextContext.Provider value={pageDataContext}>{children}</PageDataContextContext.Provider>;
	}

	static get value(): PageDataContext {
		return useContext(PageDataContextContext);
	}

	static set value(value: PageDataContext) {
		_setPageDataContext(value);
	}
}
