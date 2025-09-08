import { PageProps } from "@components/ContextProviders";
import ContextService from "@core-ui/ContextServices/ContextService";
import { createContext, Dispatch, ReactElement, SetStateAction, useContext } from "react";
import PageDataContext from "../../logic/Context/PageDataContext";

export const PageDataContextContext = createContext<PageDataContext>(undefined);

class PageDataContextService implements ContextService {
	private _setPageDataContext: Dispatch<SetStateAction<PageDataContext>>;
	private _pageDataContextRef: { value: PageDataContext } = { value: null };

	Init({ children, pageProps }: { children: ReactElement; pageProps: PageProps }): ReactElement {
		return <PageDataContextContext.Provider value={pageProps.context}>{children}</PageDataContextContext.Provider>;
	}

	Provider({ children, value }: { children: ReactElement; value: PageDataContext }): ReactElement {
		return <PageDataContextContext.Provider value={value}>{children}</PageDataContextContext.Provider>;
	}

	get ref(): { value: PageDataContext } {
		return this._pageDataContextRef;
	}

	get value(): PageDataContext {
		return useContext(PageDataContextContext);
	}
}

export default new PageDataContextService();
