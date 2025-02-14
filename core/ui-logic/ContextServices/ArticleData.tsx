import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { createContext, ReactElement, useContext } from "react";

const ArticleDataContext = createContext<ArticlePageData>(undefined);

abstract class ArticleDataService {
	static Provider({ children, value }: { children: ReactElement; value: ArticlePageData }): ReactElement {
		return <ArticleDataContext.Provider value={value}>{children}</ArticleDataContext.Provider>;
	}

	static get value(): ArticlePageData {
		return useContext(ArticleDataContext);
	}
}

export default ArticleDataService;
