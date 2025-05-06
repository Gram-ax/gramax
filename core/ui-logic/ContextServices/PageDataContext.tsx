import { PageProps } from "@components/ContextProviders";
import ContextService from "@core-ui/ContextServices/ContextService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useEffect, useState } from "react";
import PageDataContext from "../../logic/Context/PageDataContext";

export const PageDataContextContext = createContext<PageDataContext>(undefined);

class PageDataContextService implements ContextService {
	private _setPageDataContext: Dispatch<SetStateAction<PageDataContext>>;

	Init({ children, pageProps }: { children: ReactElement; pageProps: PageProps }): ReactElement {
		const [pageDataContext, setPageDataContext] = useState<PageDataContext>(pageProps.context);
		this._setPageDataContext = setPageDataContext;

		useEffect(() => {
			setPageDataContext(pageProps.context);
		}, [pageProps.context]);

		return <PageDataContextContext.Provider value={pageDataContext}>{children}</PageDataContextContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: PageDataContext }): ReactElement {
		return <PageDataContextContext.Provider value={value}>{children}</PageDataContextContext.Provider>;
	}

	get value(): PageDataContext {
		return useContext(PageDataContextContext);
	}

	set value(value: PageDataContext) {
		this._setPageDataContext(value);
	}
}

export default new PageDataContextService();
