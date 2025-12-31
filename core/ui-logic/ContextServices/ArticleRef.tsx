import { createContext, MutableRefObject, ReactElement, useContext, useRef } from "react";

const ArticleRefContext = createContext<MutableRefObject<HTMLDivElement>>(undefined);

abstract class ArticleRefService {
	static Provider({ children, value: initialValue }: { children: ReactElement; value?: HTMLDivElement }): ReactElement {
		const value = useRef<HTMLDivElement>(initialValue);
		return <ArticleRefContext.Provider value={value}>{children}</ArticleRefContext.Provider>;
	}

	static get value(): MutableRefObject<HTMLDivElement> {
		return useContext(ArticleRefContext);
	}
}

export default ArticleRefService;
